"""Catalog filtering and search without django-filter.

Flow: parse → apply attribute filters → search → build facet options.
Facet options use a stable category/search universe with per-option counts.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field

from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.db.models import Count, QuerySet
from django.http import QueryDict

from .models import FilterCategory, ProductFilter, Products
from .utils import alphanumeric_sort

SKIP_QUERY_KEYS = frozenset({"query", "page", "productsPerPage"})


@dataclass
class CatalogQueryParams:
    search: str | None = None
    # FilterCategory name (as in DB) → selected FilterValue pks
    attribute_filters: dict[str, list[int]] = field(default_factory=dict)


def _parse_value_ids(raw: str) -> list[int]:
    """Parse `1|2|3` (and legacy `['1|2']`-style artifacts) into ints."""
    cleaned = raw.strip().strip("[]'\"")
    ids: list[int] = []
    for part in cleaned.split("|"):
        part = part.strip().strip("'\"")
        if not part:
            continue
        try:
            ids.append(int(part))
        except ValueError:
            continue
    return ids


def parse_catalog_query_params(query_params: QueryDict) -> CatalogQueryParams:
    search = (query_params.get("query") or "").strip() or None

    valid_by_upper = {
        name.upper(): name
        for name in FilterCategory.objects.values_list("name", flat=True)
    }

    attribute_filters: dict[str, list[int]] = {}
    for key in query_params.keys():
        if key in SKIP_QUERY_KEYS:
            continue
        category_name = valid_by_upper.get(key.upper())
        if category_name is None:
            continue
        raw_values = query_params.getlist(key)
        if not raw_values:
            continue
        value_ids = _parse_value_ids(raw_values[0])
        if value_ids:
            attribute_filters[category_name] = value_ids

    return CatalogQueryParams(search=search, attribute_filters=attribute_filters)


def apply_attribute_filters(
    queryset: QuerySet,
    params: CatalogQueryParams,
    *,
    exclude_categories: frozenset[str] | None = None,
) -> QuerySet:
    """AND across filter groups; OR within a group (pk__in).

    exclude_categories: FilterCategory names to skip (for facet counts).
    """
    exclude_categories = exclude_categories or frozenset()
    for category_name, value_ids in params.attribute_filters.items():
        if category_name in exclude_categories:
            continue
        queryset = queryset.filter(filters__filter_value__pk__in=value_ids).distinct()
    return queryset


def apply_search(queryset: QuerySet, search: str | None) -> QuerySet:
    """Postgres FTS over product name and model (same fields as before)."""
    if not search:
        return queryset
    vector = SearchVector("name", "model")
    query = SearchQuery(search)
    return (
        queryset.annotate(rank=SearchRank(vector, query))
        .filter(rank__gt=0.0001)
        .order_by("-rank")
    )


def filter_products(queryset: QuerySet, query_params: QueryDict) -> QuerySet:
    params = parse_catalog_query_params(query_params)
    queryset = apply_attribute_filters(queryset, params)
    queryset = apply_search(queryset, params.search)
    return queryset


def _product_ids_for_facets(
    universe_ids: list[int],
    params: CatalogQueryParams,
    *,
    exclude_categories: frozenset[str] | None = None,
) -> list[int]:
    """Resolve facet product ids from a materialized universe (no repeated FTS)."""
    queryset = Products.objects.filter(pk__in=universe_ids)
    queryset = apply_attribute_filters(
        queryset,
        params,
        exclude_categories=exclude_categories,
    )
    return list(queryset.values_list("pk", flat=True))


def _counts_by_value(product_ids: list[int], category_names: list[str]) -> dict[str, dict[int, int]]:
    """One SQL: counts keyed by filter category name → value id → count."""
    result: dict[str, dict[int, int]] = defaultdict(dict)
    if not product_ids or not category_names:
        return result

    rows = (
        ProductFilter.objects.filter(
            product_id__in=product_ids,
            filter_category__name__in=category_names,
        )
        .values("filter_category__name", "filter_value_id")
        .annotate(count=Count("product_id", distinct=True))
    )
    for row in rows:
        result[row["filter_category__name"]][row["filter_value_id"]] = row["count"]
    return result


def build_facet_options(base_queryset: QuerySet, query_params: QueryDict) -> list[dict]:
    """Stable sidebar options for the category/search scope, with live counts.

    - Universe = products in scope after search, ignoring attribute filters
      (options never disappear when the shopper narrows selection).
    - Counts for a group apply every other selected group, but not the group's
      own selection, so multi-select within a group stays OR.
    - FTS runs once; unselected groups share one count query.
    """
    params = parse_catalog_query_params(query_params)

    # Materialize once so facet SQL does not re-evaluate SearchVector.
    universe_ids = list(
        apply_search(base_queryset, params.search).values_list("pk", flat=True)
    )
    if not universe_ids:
        return []

    universe_rows = (
        ProductFilter.objects.filter(product_id__in=universe_ids)
        .values_list(
            "filter_category__name",
            "filter_value_id",
            "filter_value__value",
        )
        .distinct()
    )

    options_by_category: dict[str, set[tuple[int, str]]] = defaultdict(set)
    for category_name, value_id, value_label in universe_rows:
        options_by_category[category_name].add((value_id, value_label))

    if not options_by_category:
        return []

    selected_categories = set(params.attribute_filters)
    unselected_categories = [
        name for name in options_by_category if name not in selected_categories
    ]
    selected_present = [
        name for name in options_by_category if name in selected_categories
    ]

    counts_by_category: dict[str, dict[int, int]] = {}

    # Unselected groups share the same product set (all current selections applied).
    if unselected_categories:
        shared_ids = _product_ids_for_facets(universe_ids, params)
        counts_by_category.update(
            _counts_by_value(shared_ids, unselected_categories)
        )

    # Selected groups need "exclude own selection" so OR within the group stays correct.
    for category_name in selected_present:
        facet_ids = _product_ids_for_facets(
            universe_ids,
            params,
            exclude_categories=frozenset({category_name}),
        )
        counts_by_category.update(_counts_by_value(facet_ids, [category_name]))

    filters: list[dict] = []
    for category_name, options in sorted(
        options_by_category.items(),
        key=lambda item: alphanumeric_sort(item[0]),
    ):
        counts = counts_by_category.get(category_name, {})
        text = [
            {
                "id": value_id,
                "label": value_label,
                "count": counts.get(value_id, 0),
            }
            for value_id, value_label in sorted(
                options,
                key=lambda item: alphanumeric_sort(item[1]),
            )
        ]
        filters.append({"name": category_name.upper(), "text": text})

    return filters
