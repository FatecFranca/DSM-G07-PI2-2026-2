from django.contrib import admin

from .models import AcompanhamentoOrdem, ContaCliente, ContaTecnico


@admin.register(ContaTecnico)
class ContaTecnicoAdmin(admin.ModelAdmin):
    list_display = ("tecnico", "usuario")
    search_fields = ("tecnico__nome", "usuario__username")


@admin.register(ContaCliente)
class ContaClienteAdmin(admin.ModelAdmin):
    list_display = ("cliente", "usuario")
    search_fields = ("cliente__cpf", "cliente__nome_completo", "usuario__email")


@admin.register(AcompanhamentoOrdem)
class AcompanhamentoOrdemAdmin(admin.ModelAdmin):
    list_display = ("ordem_servico", "status", "atualizado_em")
    list_filter = ("status",)
