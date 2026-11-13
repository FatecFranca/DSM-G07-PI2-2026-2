import json
import secrets
import uuid
from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from .models import (
    Agendamento,
    Aparelho,
    Cliente,
    ContaTecnico,
    ItemServico,
    Orcamento,
    OrdemServico,
    OsAgendamento,
    Servico,
)

@ensure_csrf_cookie
@require_GET
def csrf_cookie(request):
    return JsonResponse({"ok": True})


@require_POST
def api_login(request):
    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"erro": "JSON inválido."}, status=400)

    if not isinstance(dados, dict):
        return JsonResponse({"erro": "Envie um objeto JSON."}, status=400)

    username = dados.get("username")
    password = dados.get("password")

    if not isinstance(username, str) or not isinstance(password, str):
        return JsonResponse({"erro": "Usuário e senha são obrigatórios."}, status=400)

    usuario = authenticate(
        request,
        username=username.strip(),
        password=password,
    )
    if usuario is None:
        return JsonResponse({"erro": "Usuário ou senha inválidos."}, status=401)

    try:
        vinculo = usuario.conta_tecnico
    except ContaTecnico.DoesNotExist:
        return JsonResponse({"erro": "Esta conta não está vinculada a um técnico."}, status=403)

    login(request, usuario)

    return JsonResponse({
        "tecnico": {
            "id": vinculo.tecnico.id_tecnico,
            "nome": vinculo.tecnico.nome,
            "nivel": vinculo.tecnico.nivel,
        }
    })


@require_GET
def api_me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"erro": "Login necessário."}, status=401)

    try:
        tecnico = request.user.conta_tecnico.tecnico
    except ContaTecnico.DoesNotExist:
        return JsonResponse({"erro": "Conta sem técnico vinculado."}, status=403)

    return JsonResponse({
        "tecnico": {
            "id": tecnico.id_tecnico,
            "nome": tecnico.nome,
            "nivel": tecnico.nivel,
        }
    })


@require_POST
def api_logout(request):
    logout(request)
    return JsonResponse({"ok": True})

@require_POST
def criar_os(request):
    if not request.user.is_authenticated:
        return JsonResponse({"erro": "Faça login para registrar uma OS."}, status=401)

    try:
        tecnico = request.user.conta_tecnico.tecnico
    except ContaTecnico.DoesNotExist:
        return JsonResponse(
            {"erro": "Esta conta não está vinculada a um técnico."},
            status=403,
        )

    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"erro": "JSON inválido."}, status=400)

    if not isinstance(dados, dict):
        return JsonResponse({"erro": "Envie um objeto JSON."}, status=400)

    cliente_dados = dados.get("cliente")
    aparelho_dados = dados.get("aparelho")
    agendamento_dados = dados.get("agendamento")

    if not all(isinstance(item, dict) for item in (
        cliente_dados,
        aparelho_dados,
        agendamento_dados,
    )):
        return JsonResponse(
            {"erro": "Informe cliente, aparelho e agendamento."},
            status=400,
        )

    campos_cliente = (
        "nome_completo",
        "cpf",
        "telefone",
        "cep",
        "numero",
        "bairro",
        "rua",
        "cidade",
        "estado",
    )

    for campo in campos_cliente:
        valor = cliente_dados.get(campo)
        if not isinstance(valor, str) or not valor.strip():
            return JsonResponse(
                {"erro": f"O campo cliente.{campo} é obrigatório."},
                status=400,
            )

    cpf = "".join(
        caractere
        for caractere in cliente_dados["cpf"]
        if caractere.isdigit()
    )
    if len(cpf) != 11:
        return JsonResponse(
            {"erro": "O CPF precisa ter 11 dígitos."},
            status=400,
        )

    numero_serie = aparelho_dados.get("numero_serie", "")
    equipamento = aparelho_dados.get("equipamento", "")
    defeito = aparelho_dados.get("defeito", "")

    if not all(isinstance(valor, str) for valor in (
        numero_serie,
        equipamento,
        defeito,
    )):
        return JsonResponse(
            {"erro": "Os dados do aparelho precisam ser textos."},
            status=400,
        )

    if not equipamento.strip() or not defeito.strip():
        return JsonResponse(
            {"erro": "Informe o tipo de aparelho e o problema relatado."},
            status=400,
        )

    data = parse_datetime(agendamento_dados.get("data", ""))
    buscar = agendamento_dados.get("buscar")

    if data is None:
        return JsonResponse(
            {"erro": "Informe a data e hora em formato ISO, com fuso horário."},
            status=400,
        )

    if timezone.is_naive(data):
        return JsonResponse(
            {"erro": "A data precisa incluir o fuso horário."},
            status=400,
        )

    if not isinstance(buscar, bool):
        return JsonResponse(
            {"erro": "O campo agendamento.buscar precisa ser verdadeiro ou falso."},
            status=400,
        )

    estado = cliente_dados["estado"].strip().upper()
    if len(estado) != 2:
        return JsonResponse(
            {"erro": "O estado deve ter a sigla de dois caracteres."},
            status=400,
        )

    referencia = cliente_dados.get("referencia", "")
    if not isinstance(referencia, str):
        return JsonResponse(
            {"erro": "A referência do endereço precisa ser texto."},
            status=400,
        )

    observacao = (
        f"Equipamento: {equipamento.strip()}\n"
        f"Problema: {defeito.strip()}"
    )

    with transaction.atomic():
        cliente, cliente_novo = Cliente.objects.get_or_create(
            cpf=cpf,
            defaults={
                "nome_completo": cliente_dados["nome_completo"].strip(),
                "senha": make_password(secrets.token_urlsafe(32)),
                "telefone": cliente_dados["telefone"].strip(),
                "cep": cliente_dados["cep"].strip(),
                "numero": cliente_dados["numero"].strip(),
                "bairro": cliente_dados["bairro"].strip(),
                "rua": cliente_dados["rua"].strip(),
                "cidade": cliente_dados["cidade"].strip(),
                "referencia": referencia.strip() or None,
                "estado": estado,
            },
        )

        numero_os = f"OS-{uuid.uuid4().hex[:16]}"

        ordem = OrdemServico.objects.create(
            numero_os=numero_os,
            id_cliente=cliente,
            id_tecnico=tecnico,
        )

        aparelho = Aparelho.objects.create(
            id_ordem_servico=ordem,
            numero_serie=numero_serie.strip() or None,
            observacao=observacao,
        )

        agendamento = Agendamento.objects.create(
            status="Agendado",
            data=data,
            buscar=buscar,
        )

        OsAgendamento.objects.create(
            id_ordem_servico=ordem,
            id_agendamento=agendamento,
        )

    return JsonResponse(
        {
            "id": ordem.id_ordem_servico,
            "numero_os": ordem.numero_os,
            "cliente_id": cliente.id_cliente,
            "tecnico": {
                "id": tecnico.id_tecnico,
                "nome": tecnico.nome,
            },
            "aparelho_id": aparelho.id_aparelho,
            "agendamento_id": agendamento.id_agendamento,
            "cliente_criado": cliente_novo,
        },
        status=201,
    )

@require_GET
def listar_os(request):
    if not request.user.is_authenticated:
        return JsonResponse({"erro": "Faça login."}, status=401)

    try:
        tecnico = request.user.conta_tecnico.tecnico
    except ContaTecnico.DoesNotExist:
        return JsonResponse(
            {"erro": "Esta conta não está vinculada a um técnico."},
            status=403,
        )

    ordens = (
        OrdemServico.objects
        .filter(id_tecnico=tecnico)
        .select_related("id_cliente", "id_tecnico")
        .order_by("-id_ordem_servico")
    )

    resultado = []

    for ordem in ordens:
        cliente = ordem.id_cliente

        aparelho = Aparelho.objects.filter(
            id_ordem_servico=ordem
        ).first()

        vinculos = (
            OsAgendamento.objects
            .filter(id_ordem_servico=ordem)
            .select_related("id_agendamento")
        )

        agendamentos = []
        for vinculo in vinculos:
            agendamento = vinculo.id_agendamento
            agendamentos.append({
                "id": agendamento.id_agendamento,
                "data": agendamento.data.isoformat(),
                "buscar": bool(agendamento.buscar),
                "status": agendamento.status,
            })

        orcamento = Orcamento.objects.filter(
            id_ordem_servico=ordem
        ).first()

        itens = []
        if orcamento:
            itens_db = (
                ItemServico.objects
                .filter(id_orcamento=orcamento)
                .select_related("id_servico")
            )

            for item in itens_db:
                itens.append({
                    "id_servico": item.id_servico_id,
                    "descricao": item.id_servico.descricao,
                    "quantidade": item.quantidade,
                    "mao_de_obra": str(item.mao_de_obra),
                    "custo_item": str(item.custo_item),
                })

        resultado.append({
            "id": ordem.id_ordem_servico,
            "numero_os": ordem.numero_os,
            "cliente": {
                "id": cliente.id_cliente,
                "nome_completo": cliente.nome_completo,
                "cpf": cliente.cpf,
                "telefone": cliente.telefone,
            },
            "tecnico": {
                "id": tecnico.id_tecnico,
                "nome": tecnico.nome,
                "nivel": tecnico.nivel,
            },
            "aparelho": None if aparelho is None else {
                "id": aparelho.id_aparelho,
                "numero_serie": aparelho.numero_serie,
                "observacao": aparelho.observacao,
            },
            "agendamentos": agendamentos,
            "orcamento": None if orcamento is None else {
                "id": orcamento.id_orcamento,
                "status": orcamento.status,
                "itens": itens,
            },
        })

    return JsonResponse({"ordens": resultado})

@require_http_methods(["GET", "POST"])
def os_collection(request):
    if request.method == "GET":
        return listar_os(request)

    return criar_os(request)


@require_GET
def listar_servicos(request):
    if not request.user.is_authenticated:
        return JsonResponse({"erro": "Faça login."}, status=401)

    try:
        request.user.conta_tecnico.tecnico
    except ContaTecnico.DoesNotExist:
        return JsonResponse(
            {"erro": "Esta conta não está vinculada a um técnico."},
            status=403,
        )

    servicos = list(
        Servico.objects.order_by("descricao").values(
            "id_servico",
            "descricao",
            "status",
        )
    )
    return JsonResponse({"servicos": servicos})


def _dados_orcamento(orcamento):
    itens = (
        ItemServico.objects
        .filter(id_orcamento=orcamento)
        .select_related("id_servico")
        .order_by("id_servico__descricao")
    )
    return {
        "id": orcamento.id_orcamento,
        "status": orcamento.status,
        "itens": [
            {
                "id_servico": item.id_servico_id,
                "descricao": item.id_servico.descricao,
                "quantidade": item.quantidade,
                "mao_de_obra": str(item.mao_de_obra),
                "custo_item": str(item.custo_item),
            }
            for item in itens
        ],
    }


def _valor_monetario(valor, campo):
    try:
        valor_decimal = Decimal(str(valor))
    except (InvalidOperation, TypeError, ValueError):
        return None, f"O campo {campo} precisa ser um valor monetário válido."

    if valor_decimal.is_finite() and valor_decimal.as_tuple().exponent < -2:
        return None, f"O campo {campo} pode ter no máximo duas casas decimais."
    try:
        resultado = valor_decimal.quantize(Decimal("0.01"))
    except InvalidOperation:
        return None, f"O campo {campo} está fora do limite permitido."

    if not resultado.is_finite() or resultado < 0 or resultado > Decimal("99999999.99"):
        return None, f"O campo {campo} está fora do limite permitido."

    return resultado, None


@require_http_methods(["GET", "PUT", "DELETE"])
def orcamento_os(request, os_id):
    if not request.user.is_authenticated:
        return JsonResponse({"erro": "Faça login."}, status=401)

    try:
        tecnico = request.user.conta_tecnico.tecnico
    except ContaTecnico.DoesNotExist:
        return JsonResponse(
            {"erro": "Esta conta não está vinculada a um técnico."},
            status=403,
        )

    ordem = OrdemServico.objects.filter(
        id_ordem_servico=os_id,
        id_tecnico=tecnico,
    ).first()
    if ordem is None:
        return JsonResponse({"erro": "Ordem de serviço não encontrada."}, status=404)

    orcamento = Orcamento.objects.filter(id_ordem_servico=ordem).first()

    if request.method == "GET":
        return JsonResponse({
            "orcamento": _dados_orcamento(orcamento) if orcamento else None,
        })

    if request.method == "DELETE":
        if orcamento is None:
            return HttpResponse(status=204)
        if orcamento.status != "Pendente":
            return JsonResponse(
                {"erro": "Só é possível editar um orçamento pendente."},
                status=409,
            )
        orcamento.delete()
        return HttpResponse(status=204)

    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"erro": "JSON inválido."}, status=400)

    if not isinstance(dados, dict) or not isinstance(dados.get("itens"), list):
        return JsonResponse(
            {"erro": "Envie uma lista de itens no campo 'itens'."},
            status=400,
        )
    if not dados["itens"]:
        return JsonResponse(
            {"erro": "O orçamento precisa ter pelo menos um serviço."},
            status=400,
        )
    if orcamento and orcamento.status != "Pendente":
        return JsonResponse(
            {"erro": "Só é possível editar um orçamento pendente."},
            status=409,
        )

    itens_validados = []
    ids_servico = []
    for indice, item in enumerate(dados["itens"]):
        if not isinstance(item, dict):
            return JsonResponse(
                {"erro": f"O item {indice + 1} precisa ser um objeto."},
                status=400,
            )

        id_servico = item.get("id_servico")
        quantidade = item.get("quantidade")
        if isinstance(id_servico, bool) or not str(id_servico).isdigit():
            return JsonResponse(
                {"erro": f"O item {indice + 1} precisa indicar um serviço válido."},
                status=400,
            )
        if (
            isinstance(quantidade, bool)
            or not isinstance(quantidade, int)
            or quantidade < 1
            or quantidade > 2147483647
        ):
            return JsonResponse(
                {"erro": f"A quantidade do item {indice + 1} deve ser um inteiro positivo."},
                status=400,
            )

        mao, erro = _valor_monetario(item.get("mao_de_obra"), f"itens[{indice}].mao_de_obra")
        if erro:
            return JsonResponse({"erro": erro}, status=400)
        custo, erro = _valor_monetario(item.get("custo_item"), f"itens[{indice}].custo_item")
        if erro:
            return JsonResponse({"erro": erro}, status=400)

        id_servico = int(id_servico)
        ids_servico.append(id_servico)
        itens_validados.append({
            "id_servico": id_servico,
            "quantidade": quantidade,
            "mao_de_obra": mao,
            "custo_item": custo,
        })

    if len(ids_servico) != len(set(ids_servico)):
        return JsonResponse(
            {"erro": "Cada serviço pode aparecer uma única vez; ajuste a quantidade."},
            status=400,
        )

    servicos = Servico.objects.in_bulk(ids_servico)
    if len(servicos) != len(ids_servico):
        return JsonResponse(
            {"erro": "Um ou mais serviços não existem no catálogo."},
            status=400,
        )

    with transaction.atomic():
        if orcamento is None:
            orcamento = Orcamento.objects.create(
                id_ordem_servico=ordem,
                status="Pendente",
            )

        ItemServico.objects.filter(id_orcamento=orcamento).delete()
        ItemServico.objects.bulk_create([
            ItemServico(
                id_orcamento=orcamento,
                id_servico=servicos[item["id_servico"]],
                quantidade=item["quantidade"],
                mao_de_obra=item["mao_de_obra"],
                custo_item=item["custo_item"],
            )
            for item in itens_validados
        ])

    return JsonResponse({"orcamento": _dados_orcamento(orcamento)})
