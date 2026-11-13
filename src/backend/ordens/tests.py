from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

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


class ValorMonetarioTests(SimpleTestCase):
    def test_aceita_duas_casas_decimais(self):
        valor, erro = views._valor_monetario("1234.50", "custo")

        self.assertEqual(valor, Decimal("1234.50"))
        self.assertIsNone(erro)

    def test_rejeita_precisao_maior_que_a_coluna_do_banco(self):
        valor, erro = views._valor_monetario("12.345", "custo")

        self.assertIsNone(valor)
        self.assertIsNotNone(erro)
