from django.urls import path

from . import views

urlpatterns = [
    path("csrf/", views.csrf_cookie, name="csrf_cookie"),
    path("login/", views.api_login, name="api_login"),
    path("cliente/cadastro/", views.api_cliente_cadastro, name="api_cliente_cadastro"),
    path("cliente/login/", views.api_cliente_login, name="api_cliente_login"),
    path("cliente/ordens/", views.ordens_cliente, name="ordens_cliente"),
    path(
        "cliente/os/<int:os_id>/orcamento/",
        views.responder_orcamento_cliente,
        name="responder_orcamento_cliente",
    ),
    path("me/", views.api_me, name="api_me"),
    path("logout/", views.api_logout, name="api_logout"),
    path(
        "portal/solicitacoes/",
        views.solicitar_os_portal,
        name="solicitar_os_portal",
    ),
    path("servicos/", views.listar_servicos, name="listar_servicos"),
    path(
        "os/<int:os_id>/orcamento/",
        views.orcamento_os,
        name="orcamento_os",
    ),
    path("os/<int:os_id>/status/", views.atualizar_status_os, name="atualizar_status_os"),
    path("os/", views.os_collection, name="os_collection"),
]