import json
from contextlib import nullcontext
from datetime import timedelta
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
            patch("ordens.views.AcompanhamentoOrdem.objects.update_or_create"),
            patch("ordens.views._status_ordem", return_value="Aguardando triagem"),
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

    def test_tecnico_nao_pode_registrar_aprovacao_do_cliente(self):
        request = self.factory.patch(
            "/api/os/42/orcamento/",
            data=json.dumps({"status": "Aprovado"}),
            content_type="application/json",
        )
        resposta = views.orcamento_os(request, os_id=42)

        self.assertEqual(resposta.status_code, 405)


class RespostaOrcamentoClienteTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_cliente_pode_aprovar_orcamento_da_propria_ordem(self):
        cliente = SimpleNamespace(id_cliente=5)
        ordem = SimpleNamespace(id_ordem_servico=42, id_tecnico=SimpleNamespace())
        orcamento = views.Orcamento(id_orcamento=11, status="Pendente")
        request = self.factory.post(
            "/api/cliente/os/42/orcamento/",
            data=json.dumps({"status": "Aprovado"}),
            content_type="application/json",
        )
        request.user = SimpleNamespace(
            is_authenticated=True,
            conta_cliente=SimpleNamespace(cliente=cliente),
        )

        with (
            patch("ordens.views.OrdemServico.objects.filter") as filtrar_ordem,
            patch("ordens.views.Orcamento.objects.filter") as filtrar_orcamento,
            patch("ordens.views.ItemServico.objects.filter") as filtrar_itens,
            patch("ordens.views.Orcamento.save") as salvar_orcamento,
            patch("ordens.views.AcompanhamentoOrdem.objects.update_or_create") as atualizar_status,
            patch("ordens.views.transaction.atomic", return_value=nullcontext()),
            patch(
                "ordens.views._dados_orcamento",
                return_value={"status": "Aprovado", "itens": [{}]},
            ),
            patch("ordens.views._status_ordem", return_value="Agendado"),
        ):
            filtrar_ordem.return_value.select_related.return_value.first.return_value = ordem
            filtrar_orcamento.return_value.first.return_value = orcamento
            filtrar_itens.return_value.exists.return_value = True

            resposta = views.responder_orcamento_cliente(request, os_id=42)

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(orcamento.status, "Aprovado")
        salvar_orcamento.assert_called_once_with(update_fields=["status"])
        atualizar_status.assert_called_once_with(
            ordem_servico=ordem,
            defaults={"status": "Agendado"},
        )

    def test_cliente_nao_pode_responder_ordem_de_outra_pessoa(self):
        cliente = SimpleNamespace(id_cliente=5)
        request = self.factory.post(
            "/api/cliente/os/42/orcamento/",
            data=json.dumps({"status": "Recusado"}),
            content_type="application/json",
        )
        request.user = SimpleNamespace(
            is_authenticated=True,
            conta_cliente=SimpleNamespace(cliente=cliente),
        )

        with (
            patch("ordens.views.OrdemServico.objects.filter") as filtrar_ordem,
            patch("ordens.views.Orcamento.objects.filter") as filtrar_orcamento,
        ):
            filtrar_ordem.return_value.select_related.return_value.first.return_value = None

            resposta = views.responder_orcamento_cliente(request, os_id=42)

        self.assertEqual(resposta.status_code, 404)
        filtrar_orcamento.assert_not_called()

    def test_orcamento_so_pode_ser_respondido_uma_vez(self):
        cliente = SimpleNamespace(id_cliente=5)
        ordem = SimpleNamespace(id_ordem_servico=42, id_tecnico=SimpleNamespace())
        orcamento = SimpleNamespace(id_orcamento=11, status="Aprovado")
        request = self.factory.post(
            "/api/cliente/os/42/orcamento/",
            data=json.dumps({"status": "Recusado"}),
            content_type="application/json",
        )
        request.user = SimpleNamespace(
            is_authenticated=True,
            conta_cliente=SimpleNamespace(cliente=cliente),
        )

        with (
            patch("ordens.views.OrdemServico.objects.filter") as filtrar_ordem,
            patch("ordens.views.Orcamento.objects.filter") as filtrar_orcamento,
        ):
            filtrar_ordem.return_value.select_related.return_value.first.return_value = ordem
            filtrar_orcamento.return_value.first.return_value = orcamento

            resposta = views.responder_orcamento_cliente(request, os_id=42)

        self.assertEqual(resposta.status_code, 409)


class CadastroClienteTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_rejeita_confirmacao_de_senha_diferente(self):
        request = self.factory.post(
            "/api/cliente/cadastro/",
            data=json.dumps({
                "email": "cliente@example.com",
                "password": "StrongPassword123!",
                "password_confirm": "OtherPassword123!",
                "cliente": {},
            }),
            content_type="application/json",
        )

        resposta = views.api_cliente_cadastro(request)

        self.assertEqual(resposta.status_code, 400)
        self.assertIn("confirmação da senha", json.loads(resposta.content)["erro"])


class StatusOrdemTests(SimpleTestCase):
    def test_tecnico_pode_enviar_os_em_andamento_para_aprovacao(self):
        tecnico = SimpleNamespace(id_tecnico=7)
        ordem = SimpleNamespace(id_ordem_servico=42, id_tecnico=tecnico)
        request = self.factory.patch(
            "/api/os/42/status/",
            data=json.dumps({"status": "Aguardando aprovação"}),
            content_type="application/json",
        )
        request.user = SimpleNamespace(
            is_authenticated=True,
            conta_tecnico=SimpleNamespace(tecnico=tecnico),
        )

        with (
            patch("ordens.views.OrdemServico.objects.filter") as filtrar_ordem,
            patch("ordens.views.AcompanhamentoOrdem.objects.update_or_create") as atualizar_status,
            patch("ordens.views._status_ordem", return_value="Em andamento"),
        ):
            filtrar_ordem.return_value.first.return_value = ordem

            resposta = views.atualizar_status_os(request, os_id=42)

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(
            json.loads(resposta.content),
            {"status": "Aguardando aprovação"},
        )
        atualizar_status.assert_called_once_with(
            ordem_servico=ordem,
            defaults={"status": "Aguardando aprovação"},
        )
    def setUp(self):
        self.factory = RequestFactory()

    def test_tecnico_nao_inicia_reparo_sem_orcamento_aprovado(self):
        tecnico = SimpleNamespace(id_tecnico=7)
        ordem = SimpleNamespace(id_ordem_servico=42, id_tecnico=tecnico)
        request = self.factory.patch(
            "/api/os/42/status/",
            data=json.dumps({"status": "Em andamento"}),
            content_type="application/json",
        )
        request.user = SimpleNamespace(
            is_authenticated=True,
            conta_tecnico=SimpleNamespace(tecnico=tecnico),
        )

        with (
            patch("ordens.views.OrdemServico.objects.filter") as filtrar_ordem,
            patch("ordens.views.Orcamento.objects.filter") as filtrar_orcamento,
            patch("ordens.views.AcompanhamentoOrdem.objects.update_or_create") as atualizar_status,
            patch("ordens.views._status_ordem", return_value="Agendado"),
        ):
            filtrar_ordem.return_value.first.return_value = ordem
            filtrar_orcamento.return_value.first.return_value = SimpleNamespace(status="Pendente")

            resposta = views.atualizar_status_os(request, os_id=42)

        self.assertEqual(resposta.status_code, 409)
        atualizar_status.assert_not_called()


class OrcamentoEmAndamentoTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_put_edita_orcamento_aprovado_e_retorna_status_atualizado(self):
        tecnico = SimpleNamespace(id_tecnico=7)
        ordem = SimpleNamespace(id_ordem_servico=42, id_tecnico=tecnico)
        orcamento = views.Orcamento(id_orcamento=11, status="Aprovado")
        servico = views.Servico(
            id_servico=3,
            descricao="Serviço de teste",
            status="Ativo",
        )

        request = self.factory.put(
            "/api/os/42/orcamento/",
            data=json.dumps({
                "itens": [{
                    "id_servico": 3,
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
            patch("ordens.views.Servico.objects.in_bulk", return_value={3: servico}),
            patch.object(orcamento, "save") as salvar_orcamento,
            patch("ordens.views.ItemServico.objects.filter") as filtrar_itens,
            patch("ordens.views.ItemServico.objects.bulk_create") as criar_itens,
            patch("ordens.views.AcompanhamentoOrdem.objects.update_or_create") as atualizar_status,
            patch(
                "ordens.views._status_ordem",
                side_effect=["Em andamento", "Em andamento", "Aguardando aprovação"],
            ),
            patch(
                "ordens.views._dados_orcamento",
                return_value={"status": "Pendente", "itens": []},
            ),
            patch("ordens.views.transaction.atomic", return_value=nullcontext()),
        ):
            filtrar_ordem.return_value.first.return_value = ordem
            filtrar_orcamento.return_value.first.return_value = orcamento

            resposta = views.orcamento_os(request, os_id=42)

        dados_resposta = json.loads(resposta.content)

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(dados_resposta["status"], "Aguardando aprovação")
        self.assertEqual(dados_resposta["orcamento"]["status"], "Pendente")
        self.assertEqual(orcamento.status, "Pendente")
        salvar_orcamento.assert_called_once_with(update_fields=["status"])
        atualizar_status.assert_called_once_with(
            ordem_servico=ordem,
            defaults={"status": "Aguardando aprovação"},
        )
        filtrar_itens.return_value.delete.assert_called_once_with()
        criar_itens.assert_called_once()

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


class SolicitacaoClienteTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_solicitacao_exige_sessao_autenticada(self):
        request = self.factory.post("/api/cliente/solicitacoes/")
        request.user = SimpleNamespace(is_authenticated=False)

        resposta = views.solicitar_os_cliente(request)

        self.assertEqual(resposta.status_code, 401)

    def test_solicitacao_usa_cliente_vinculado_a_sessao(self):
        cliente = SimpleNamespace(id_cliente=5)
        tecnico = SimpleNamespace(id_tecnico=2)
        request = self.factory.post(
            "/api/cliente/solicitacoes/",
            data=json.dumps({
                "aparelho": {
                    "numero_serie": "ABC123",
                    "equipamento": "Notebook",
                    "defeito": "Não liga",
                },
                "agendamento": {
                    "data": (views.timezone.now() + timedelta(days=1)).isoformat(),
                    "buscar": False,
                },
            }),
            content_type="application/json",
        )
        request.user = SimpleNamespace(
            is_authenticated=True,
            conta_cliente=SimpleNamespace(cliente=cliente),
        )

        with (
            patch("ordens.views.Tecnico.objects.get", return_value=tecnico),
            patch(
                "ordens.views._registrar_os",
                return_value=JsonResponse({"numero_os": "OS-TESTE"}, status=201),
            ) as registrar_os,
        ):
            resposta = views.solicitar_os_cliente(request)

        self.assertEqual(resposta.status_code, 201)
        registrar_os.assert_called_once_with(
            request,
            tecnico,
            cliente_autenticado=cliente,
        )

    def test_registra_os_com_apenas_dados_do_aparelho_e_sessao_do_cliente(self):
        cliente = SimpleNamespace(
            id_cliente=5,
            nome_completo="Cliente cadastrado",
            cpf="12345678901",
            telefone="11999999999",
            cep="12345678",
            numero="10",
            bairro="Centro",
            rua="Rua Um",
            cidade="São Paulo",
            referencia="",
            estado="SP",
        )
        tecnico = SimpleNamespace(id_tecnico=2, nome="Técnico")
        ordem = SimpleNamespace(id_ordem_servico=42, numero_os="OS-TESTE")
        request = self.factory.post(
            "/api/cliente/solicitacoes/",
            data=json.dumps({
                "aparelho": {
                    "numero_serie": "",
                    "equipamento": "Notebook",
                    "defeito": "Não liga",
                },
                "agendamento": {
                    "data": (views.timezone.now() + timedelta(days=1)).isoformat(),
                    "buscar": False,
                },
            }),
            content_type="application/json",
        )

        with (
            patch("ordens.views.OrdemServico.objects.create", return_value=ordem) as criar_ordem,
            patch("ordens.views.AcompanhamentoOrdem.objects.create"),
            patch(
                "ordens.views.Aparelho.objects.create",
                return_value=SimpleNamespace(id_aparelho=7),
            ),
            patch(
                "ordens.views.Agendamento.objects.create",
                return_value=SimpleNamespace(
                    id_agendamento=8,
                    data=views.timezone.now() + timedelta(days=1),
                ),
            ),
            patch("ordens.views.OsAgendamento.objects.create"),
            patch("ordens.views.transaction.atomic", return_value=nullcontext()),
        ):
            resposta = views._registrar_os(
                request,
                tecnico,
                cliente_autenticado=cliente,
            )

        self.assertEqual(resposta.status_code, 201)
        criar_ordem.assert_called_once()
        self.assertIs(criar_ordem.call_args.kwargs["id_cliente"], cliente)


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
