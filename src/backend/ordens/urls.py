from django.urls import path

from . import views

urlpatterns = [
    path("csrf/", views.csrf_cookie, name="csrf_cookie"),
    path("login/", views.api_login, name="api_login"),
    path("me/", views.api_me, name="api_me"),
    path("logout/", views.api_logout, name="api_logout"),
    path("servicos/", views.listar_servicos, name="listar_servicos"),
    path(
        "os/<int:os_id>/orcamento/",
        views.orcamento_os,
        name="orcamento_os",
    ),
    path("os/", views.os_collection, name="os_collection"),
]