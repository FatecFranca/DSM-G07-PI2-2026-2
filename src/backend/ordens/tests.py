import json
from contextlib import nullcontext
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

from django.conf import settings
from django.http import JsonResponse
from django.test import RequestFactory, SimpleTestCase

from . import views


class OrcamentoEndpointTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_orcamento_filtros_os_pelo_tecnico_da_sessao(self):
        tecnico = SimpleNamespace(id_tecnico=7)
        request = self.factory.get("/api/os/42/orcamento/")
        request.user = SimpleNamespace(
            is_authenticated=True,
            conta_tecnico=SimpleNamespace(tecnico=tecnico),
        )

        with patch("ordens.views.OrdemServico.objects.filter") as filtrar_ordem:
            filtrar_ordem.return_value.first.return_value = None
            resposta = views.orcamento_os(request, os_id=42)

        self.assertEqual(resposta.status_code, 404)
        filtrar_ordem.assert_called_once_with(
            id_ordem_servico=42,
            id_tecnico=tecnico,
        )

    def test_orcamento_exige_sessao_autenticada(self):
        request = self.factory.get("/api/os/42/orcamento/")
        request.user = SimpleNamespace(is_authenticated=False)

        resposta = views.orcamento_os(request, os_id=42)

        self.assertEqual(resposta.status_code, 401)

    def test_put_aceita_servico_descrito_pelo_tecnico(self):
        tecnico = views.Tecnico(id_tecnico=7)
        ordem = views.OrdemServico(id_ordem_servico=42, id_tecnico=tecnico)
        orcamento = views.Orcamento(
            id_orcamento=11,
            id_ordem_servico=ordem,
            status="Pendente",
        )
        servico = views.Servico(
            id_servico=3,
            descricao="Troca de tela",
            status="Ativo",
        )
        request = self.factory.put(
            "/api/os/42/orcamento/",
            data=json.dumps({
                "itens": [{
                    "descricao_servico": "Troca de tela",
                    "quantidade": 1,
                    "mao_de_obra": "50.00",
                    "custo_item": "20.00",
                }],
            }),
            content_type="application/json",
        )
        request.user = SimpleNamespace(
            is_authenticated=True,
            conta_tecnico=SimpleNamespace(tecnico=tecnico),
        )

        with (
            patch("ordens.views.OrdemServico.objects.filter") as filtrar_ordem,
            patch("ordens.views.Orcamento.objects.filter") as filtrar_orcamento,
            patch("ordens.views.Orcamento.objects.create", return_value=orcamento) as criar_orcamento,
            patch("ordens.views.Servico.objects.in_bulk", return_value={}),
            patch("ordens.views._resolver_servico_orcamento", return_value=servico) as resolver_servico,
            patch("ordens.views.ItemServico.objects.filter") as filtrar_itens,
            patch("ordens.views.ItemServico.objects.bulk_create") as criar_itens,
            patch("ordens.views.transaction.atomic", return_value=nullcontext()),
            patch("ordens.views._dados_orcamento", return_value={"id": 11, "itens": []}),
        ):
            filtrar_ordem.return_value.first.return_value = ordem
            filtrar_orcamento.return_value.first.return_value = None

            resposta = views.orcamento_os(request, os_id=42)

        self.assertEqual(resposta.status_code, 200)
        criar_orcamento.assert_called_once_with(
            id_ordem_servico=ordem,
            status="Pendente",
        )
        resolver_servico.assert_called_once_with("Troca de tela")
        filtrar_itens.return_value.delete.assert_called_once_with()
        criar_itens.assert_called_once()

    def test_patch_registra_aprovacao_do_orcamento_pendente(self):
        tecnico = SimpleNamespace(id_tecnico=7)
        ordem = SimpleNamespace(id_ordem_servico=42, id_tecnico=tecnico)
        orcamento = views.Orcamento(id_orcamento=11, status="Pendente")
        request = self.factory.patch(
            "/api/os/42/orcamento/",
            data=json.dumps({"status": "Aprovado"}),
            content_type="application/json",
        )
        request.user = SimpleNamespace(
            is_authenticated=True,
            conta_tecnico=SimpleNamespace(tecnico=tecnico),
        )

        with (
            patch("ordens.views.OrdemServico.objects.filter") as filtrar_ordem,
            patch("ordens.views.Orcamento.objects.filter") as filtrar_orcamento,
            patch("ordens.views.ItemServico.objects.filter") as filtrar_itens,
            patch("ordens.views.Orcamento.save") as salvar_orcamento,
            patch(
                "ordens.views._dados_orcamento",
                side_effect=lambda atual: {"status": atual.status, "itens": [{}]},
            ),
        ):
            filtrar_ordem.return_value.first.return_value = ordem
            filtrar_orcamento.return_value.first.return_value = orcamento
            filtrar_itens.return_value.exists.return_value = True

            resposta = views.orcamento_os(request, os_id=42)

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(orcamento.status, "Aprovado")
        salvar_orcamento.assert_called_once_with(update_fields=["status"])
        self.assertEqual(json.loads(resposta.content)["orcamento"]["status"], "Aprovado")

    def test_patch_impede_aprovar_orcamento_sem_itens(self):
        tecnico = SimpleNamespace(id_tecnico=7)
        ordem = SimpleNamespace(id_ordem_servico=42, id_tecnico=tecnico)
        orcamento = views.Orcamento(id_orcamento=11, status="Pendente")
        request = self.factory.patch(
            "/api/os/42/orcamento/",
            data=json.dumps({"status": "Aprovado"}),
            content_type="application/json",
        )
        request.user = SimpleNamespace(
            is_authenticated=True,
            conta_tecnico=SimpleNamespace(tecnico=tecnico),
        )

        with (
            patch("ordens.views.OrdemServico.objects.filter") as filtrar_ordem,
            patch("ordens.views.Orcamento.objects.filter") as filtrar_orcamento,
            patch("ordens.views.ItemServico.objects.filter") as filtrar_itens,
            patch("ordens.views.Orcamento.save") as salvar_orcamento,
        ):
            filtrar_ordem.return_value.first.return_value = ordem
            filtrar_orcamento.return_value.first.return_value = orcamento
            filtrar_itens.return_value.exists.return_value = False

            resposta = views.orcamento_os(request, os_id=42)

        self.assertEqual(resposta.status_code, 409)
        salvar_orcamento.assert_not_called()


class ValorMonetarioTests(SimpleTestCase):
    def test_aceita_duas_casas_decimais(self):
        valor, erro = views._valor_monetario("1234.50", "custo")

        self.assertEqual(valor, Decimal("1234.50"))
        self.assertIsNone(erro)

    def test_rejeita_precisao_maior_que_a_coluna_do_banco(self):
        valor, erro = views._valor_monetario("12.345", "custo")

        self.assertIsNone(valor)
        self.assertIsNotNone(erro)


class ResolverServicoOrcamentoTests(SimpleTestCase):
    def test_reutiliza_servico_ja_cadastrado(self):
        servico = SimpleNamespace(id_servico=3, descricao="Diagnóstico")
        with (
            patch("ordens.views.Servico.objects.filter") as filtrar,
            patch("ordens.views.Servico.objects.create") as criar,
        ):
            filtrar.return_value.order_by.return_value.first.return_value = servico

            resultado = views._resolver_servico_orcamento("Diagnóstico")

        self.assertIs(resultado, servico)
        criar.assert_not_called()

    def test_cadastra_servico_novo_como_ativo(self):
        servico = SimpleNamespace(id_servico=4, descricao="Troca de tela")
        with (
            patch("ordens.views.Servico.objects.filter") as filtrar,
            patch("ordens.views.Servico.objects.create", return_value=servico) as criar,
        ):
            filtrar.return_value.order_by.return_value.first.return_value = None

            resultado = views._resolver_servico_orcamento("Troca de tela")

        self.assertIs(resultado, servico)
        criar.assert_called_once_with(
            descricao="Troca de tela",
            status="Ativo",
        )


class PortalPublicoTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_solicitacao_usa_tecnico_padrao_do_servidor(self):
        request = self.factory.post(
            "/api/portal/solicitacoes/",
            data='{"tecnico_id": 999}',
            content_type="application/json",
        )
        request.user = SimpleNamespace(is_authenticated=False)
        tecnico = SimpleNamespace(id_tecnico=settings.DEFAULT_TECHNICIAN_ID)

        with (
            patch("ordens.views.Tecnico.objects.get", return_value=tecnico) as buscar_tecnico,
            patch(
                "ordens.views._registrar_os",
                return_value=JsonResponse({"numero_os": "OS-TESTE"}, status=201),
            ) as registrar_os,
        ):
            resposta = views.solicitar_os_portal(request)

        self.assertEqual(resposta.status_code, 201)
        buscar_tecnico.assert_called_once_with(pk=settings.DEFAULT_TECHNICIAN_ID)
        registrar_os.assert_called_once_with(
            request,
            tecnico,
            resposta_publica=True,
        )

    def test_portal_informa_quando_tecnico_padrao_nao_existe(self):
        request = self.factory.post("/api/portal/solicitacoes/")
        request.user = SimpleNamespace(is_authenticated=False)

        with patch(
            "ordens.views.Tecnico.objects.get",
            side_effect=views.Tecnico.DoesNotExist,
        ):
            resposta = views.solicitar_os_portal(request)

        self.assertEqual(resposta.status_code, 503)


class CriacaoOsTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_rejeita_agendamento_no_passado(self):
        request = self.factory.post(
            "/api/portal/solicitacoes/",
            data=json.dumps({
                "cliente": {
                    "nome_completo": "Cliente Teste",
                    "cpf": "12345678901",
                    "telefone": "11999999999",
                    "cep": "12345678",
                    "numero": "10",
                    "bairro": "Centro",
                    "rua": "Rua Um",
                    "cidade": "São Paulo",
                    "estado": "SP",
                    "referencia": "",
                },
                "aparelho": {
                    "numero_serie": "",
                    "equipamento": "Notebook",
                    "defeito": "Não liga",
                },
                "agendamento": {
                    "data": "2020-01-01T10:00:00+00:00",
                    "buscar": False,
                },
            }),
            content_type="application/json",
        )

        resposta = views._registrar_os(
            request,
            SimpleNamespace(id_tecnico=1, nome="Técnico"),
            resposta_publica=True,
        )

        self.assertEqual(resposta.status_code, 400)
