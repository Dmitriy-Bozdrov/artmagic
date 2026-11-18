from carts.models import Order


def new_orders_count():
    return Order.objects.filter(status=Order.STATUS_NEW).count()
