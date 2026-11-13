from django.urls import path

from . import views

urlpatterns = [
    path("tecnicos/", views.listar_tecnicos, name="listar_tecnicos"),
     path("csrf/", views.csrf_token, name="csrf_token"),
    path("tecnicos/", views.tecnicos, name="tecnicos"),
    path("tecnicos/<int:id_tecnico>/", views.tecnico_por_id, name="tecnico_por_id"),
]