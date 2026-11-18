from django import template
from django.urls import reverse

from carts.badge import new_orders_count

register = template.Library()


@register.inclusion_tag("admin/carts/order_badge.html")
def new_orders_badge():
    return {
        "count": new_orders_count(),
        "url": reverse("admin:carts_order_changelist") + "?status__exact=new",
    }
