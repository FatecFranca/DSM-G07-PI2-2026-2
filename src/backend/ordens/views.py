import json
import secrets
import uuid
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from .models import (
    AcompanhamentoOrdem,
    Agendamento,
    Aparelho,
    Cliente,
    ContaCliente,
    ContaTecnico,
    ItemServico,
    Orcamento,
    OrdemServico,
    OsAgendamento,
    Servico,
    Tecnico,
)

STATUS_INICIAL_OS = "Aguardando triagem"
TRANSICOES_STATUS_OS = {
    "Aguardando triagem": {"Cancelado"},
    "Aguardando aprovação": {"Cancelado"},
    "Agendado": {"Em andamento", "Cancelado"},
    "Em andamento": {"Concluído", "Cancelado"},
    "Concluído": set(),
    "Cancelado": set(),
}


class _ServicoDuplicadoNoOrcamento(Exception):
    pass


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
    try:
        usuario.conta_cliente
    except ContaCliente.DoesNotExist:
        pass
    else:
        return JsonResponse({"erro": "Esta conta possui mais de um perfil."}, status=403)

    login(request, usuario)

    return JsonResponse({
        "tecnico": {
            "id": vinculo.tecnico.id_tecnico,
            "nome": vinculo.tecnico.nome,
            "nivel": vinculo.tecnico.nivel,
        }
    })


def _json_objeto(request):
    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, JsonResponse({"erro": "JSON inválido."}, status=400)
    if not isinstance(dados, dict):
        return None, JsonResponse({"erro": "Envie um objeto JSON."}, status=400)
    return dados, None


def _dados_cliente(cliente, email):
    return {
        "id": cliente.id_cliente,
        "nome": cliente.nome_completo,
        "email": email,
    }


@require_POST
def api_cliente_cadastro(request):
    dados, erro = _json_objeto(request)
    if erro:
        return erro

    email = dados.get("email")
    senha = dados.get("password")
    confirmacao = dados.get("password_confirm")
    cliente_dados = dados.get("cliente")
    if not all(isinstance(valor, str) for valor in (email, senha, confirmacao)):
        return JsonResponse(
            {"erro": "E-mail, senha e confirmação de senha são obrigatórios."},
            status=400,
        )
    if not isinstance(cliente_dados, dict):
        return JsonResponse({"erro": "Informe os dados do cliente."}, status=400)

    email = email.strip().lower()
    if len(email) > 150:
        return JsonResponse({"erro": "O e-mail pode ter no máximo 150 caracteres."}, status=400)
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({"erro": "Informe um e-mail válido."}, status=400)
    if senha != confirmacao:
        return JsonResponse({"erro": "A confirmação da senha não confere."}, status=400)

    campos_obrigatorios = (
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
    if any(
        not isinstance(cliente_dados.get(campo), str)
        or not cliente_dados[campo].strip()
        for campo in campos_obrigatorios
    ):
        return JsonResponse(
            {"erro": "Preencha todos os dados obrigatórios do cliente."},
            status=400,
        )

    cpf = "".join(caractere for caractere in cliente_dados["cpf"] if caractere.isdigit())
    cep = "".join(caractere for caractere in cliente_dados["cep"] if caractere.isdigit())
    estado = cliente_dados["estado"].strip().upper()
    if len(cpf) != 11:
        return JsonResponse({"erro": "O CPF precisa ter 11 dígitos."}, status=400)
    if len(cep) != 8:
        return JsonResponse({"erro": "O CEP precisa ter 8 dígitos."}, status=400)
    if len(estado) != 2:
        return JsonResponse({"erro": "O estado deve ter a sigla de dois caracteres."}, status=400)

    limites = {
        "nome_completo": 120,
        "telefone": 20,
        "numero": 10,
        "bairro": 80,
        "rua": 150,
        "cidade": 80,
        "referencia": 150,
    }
    for campo, limite in limites.items():
        valor = cliente_dados.get(campo, "")
        if not isinstance(valor, str) or len(valor.strip()) > limite:
            return JsonResponse(
                {"erro": f"O campo {campo} pode ter no máximo {limite} caracteres."},
                status=400,
            )

    referencia = cliente_dados.get("referencia", "").strip()
    User = get_user_model()
    usuario = User(
        username=email,
        email=email,
        first_name=cliente_dados["nome_completo"].strip()[:150],
    )
    try:
        validate_password(senha, user=usuario)
    except ValidationError as exc:
        return JsonResponse({"erro": " ".join(exc.messages)}, status=400)

    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse({"erro": "Este e-mail já possui uma conta."}, status=409)
    if Cliente.objects.filter(cpf=cpf).exists():
        return JsonResponse(
            {"erro": "Este CPF já está cadastrado. Peça ao técnico para ativar seu acesso."},
            status=409,
        )

    usuario.set_password(senha)
    try:
        with transaction.atomic():
            usuario.save()
            cliente = Cliente.objects.create(
                nome_completo=cliente_dados["nome_completo"].strip(),
                cpf=cpf,
                senha=make_password(secrets.token_urlsafe(32)),
                telefone=cliente_dados["telefone"].strip(),
                cep=cep,
                numero=cliente_dados["numero"].strip(),
                bairro=cliente_dados["bairro"].strip(),
                rua=cliente_dados["rua"].strip(),
                cidade=cliente_dados["cidade"].strip(),
                referencia=referencia or None,
                estado=estado,
            )
            ContaCliente.objects.create(cliente=cliente, usuario=usuario)
    except IntegrityError:
        return JsonResponse(
            {"erro": "Já existe um cadastro com este e-mail ou CPF."},
            status=409,
        )

    login(request, usuario)
    return JsonResponse(
        {"perfil": "cliente", "cliente": _dados_cliente(cliente, email)},
        status=201,
    )


@require_POST
def api_cliente_login(request):
    dados, erro = _json_objeto(request)
    if erro:
        return erro
    email = dados.get("email")
    senha = dados.get("password")
    if not isinstance(email, str) or not isinstance(senha, str):
        return JsonResponse({"erro": "E-mail e senha são obrigatórios."}, status=400)

    usuario = authenticate(
        request,
        username=email.strip().lower(),
        password=senha,
    )
    if usuario is None:
        return JsonResponse({"erro": "E-mail ou senha inválidos."}, status=401)
    try:
        cliente = usuario.conta_cliente.cliente
    except ContaCliente.DoesNotExist:
        return JsonResponse({"erro": "Esta conta não está vinculada a um cliente."}, status=403)
    try:
        usuario.conta_tecnico
    except ContaTecnico.DoesNotExist:
        pass
    else:
        return JsonResponse({"erro": "Esta conta possui mais de um perfil."}, status=403)

    login(request, usuario)
    return JsonResponse({
        "perfil": "cliente",
        "cliente": _dados_cliente(cliente, usuario.email),
    })


@require_GET
def api_me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"erro": "Login necessário."}, status=401)

    try:
        conta_cliente = request.user.conta_cliente
    except ContaCliente.DoesNotExist:
        conta_cliente = None
    try:
        conta_tecnico = request.user.conta_tecnico
    except ContaTecnico.DoesNotExist:
        conta_tecnico = None

    if bool(conta_cliente) == bool(conta_tecnico):
        return JsonResponse({"erro": "A conta não possui um perfil único."}, status=403)
    if conta_cliente:
        return JsonResponse({
            "perfil": "cliente",
            "cliente": _dados_cliente(conta_cliente.cliente, request.user.email),
        })

    tecnico = conta_tecnico.tecnico
    return JsonResponse({
        "perfil": "tecnico",
        "tecnico": {
            "id": tecnico.id_tecnico,
            "nome": tecnico.nome,
            "nivel": tecnico.nivel,
        },
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

    return _registrar_os(request, tecnico)


@require_POST
def solicitar_os_portal(request):
    try:
        tecnico = Tecnico.objects.get(pk=settings.DEFAULT_TECHNICIAN_ID)
    except Tecnico.DoesNotExist:
        return JsonResponse(
            {"erro": "O técnico padrão do portal não existe no cadastro do MySQL."},
            status=503,
        )

    return _registrar_os(request, tecnico, resposta_publica=True)


@require_POST
def solicitar_os_cliente(request):
    if not request.user.is_authenticated:
        return JsonResponse({"erro": "Faça login para solicitar atendimento."}, status=401)

    try:
        cliente = request.user.conta_cliente.cliente
    except (AttributeError, ContaCliente.DoesNotExist):
        return JsonResponse(
            {"erro": "Esta conta não está vinculada a um cliente."},
            status=403,
        )

    try:
        tecnico = Tecnico.objects.get(pk=settings.DEFAULT_TECHNICIAN_ID)
    except Tecnico.DoesNotExist:
        return JsonResponse(
            {"erro": "O técnico padrão do portal não existe no cadastro do MySQL."},
            status=503,
        )

    return _registrar_os(
        request,
        tecnico,
        cliente_autenticado=cliente,
    )


def _registrar_os(
    request,
    tecnico,
    resposta_publica=False,
    cliente_autenticado=None,
):
    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"erro": "JSON inválido."}, status=400)

    if not isinstance(dados, dict):
        return JsonResponse({"erro": "Envie um objeto JSON."}, status=400)

    if cliente_autenticado is None:
        try:
            cliente_autenticado = request.user.conta_cliente.cliente
        except (AttributeError, ContaCliente.DoesNotExist):
            pass

    cliente_dados = dados.get("cliente")
    if cliente_autenticado:
        cliente_dados = {
            "nome_completo": cliente_autenticado.nome_completo,
            "cpf": cliente_autenticado.cpf,
            "telefone": cliente_autenticado.telefone,
            "cep": cliente_autenticado.cep,
            "numero": cliente_autenticado.numero,
            "bairro": cliente_autenticado.bairro,
            "rua": cliente_autenticado.rua,
            "cidade": cliente_autenticado.cidade,
            "referencia": cliente_autenticado.referencia or "",
            "estado": cliente_autenticado.estado,
        }
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

    limites_cliente = {
        "nome_completo": 120,
        "telefone": 20,
        "numero": 10,
        "bairro": 80,
        "rua": 150,
        "cidade": 80,
    }
    for campo, limite in limites_cliente.items():
        if len(cliente_dados[campo].strip()) > limite:
            return JsonResponse(
                {"erro": f"O campo cliente.{campo} pode ter no máximo {limite} caracteres."},
                status=400,
            )

    cep = "".join(
        caractere for caractere in cliente_dados["cep"] if caractere.isdigit()
    )
    if len(cep) != 8:
        return JsonResponse({"erro": "O CEP precisa ter 8 dígitos."}, status=400)

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

    if len(numero_serie.strip()) > 60:
        return JsonResponse(
            {"erro": "O número de série pode ter no máximo 60 caracteres."},
            status=400,
        )

    if not equipamento.strip() or not defeito.strip():
        return JsonResponse(
            {"erro": "Informe o tipo de aparelho e o problema relatado."},
            status=400,
        )

    data_texto = agendamento_dados.get("data", "")
    if not isinstance(data_texto, str):
        return JsonResponse(
            {"erro": "A data e hora precisam estar em formato ISO."},
            status=400,
        )
    data = parse_datetime(data_texto)
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
    if data <= timezone.now():
        return JsonResponse(
            {"erro": "Escolha uma data e hora futuras para o atendimento."},
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
    if len(referencia.strip()) > 150:
        return JsonResponse(
            {"erro": "A referência pode ter no máximo 150 caracteres."},
            status=400,
        )

    observacao = (
        f"Equipamento: {equipamento.strip()}\n"
        f"Problema: {defeito.strip()}"
    )

    with transaction.atomic():
        if cliente_autenticado:
            if cpf != cliente_autenticado.cpf:
                return JsonResponse(
                    {"erro": "Uma conta de cliente só pode solicitar atendimento para seu próprio cadastro."},
                    status=403,
                )
            cliente, cliente_novo = cliente_autenticado, False
        else:
            cliente, cliente_novo = Cliente.objects.get_or_create(
                cpf=cpf,
                defaults={
                    "nome_completo": cliente_dados["nome_completo"].strip(),
                    "senha": make_password(secrets.token_urlsafe(32)),
                    "telefone": cliente_dados["telefone"].strip(),
                    "cep": cep,
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
        AcompanhamentoOrdem.objects.create(
            ordem_servico=ordem,
            status=STATUS_INICIAL_OS,
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

    resposta = {
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
    }
    if resposta_publica:
        resposta = {
            "numero_os": ordem.numero_os,
            "agendamento": {
                "data": agendamento.data.isoformat(),
                "buscar": bool(agendamento.buscar),
            },
        }

    return JsonResponse(resposta, status=201)

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
            "status": _status_ordem(ordem, orcamento),
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


def _status_ordem(ordem, orcamento=None):
    status = AcompanhamentoOrdem.objects.filter(
        ordem_servico=ordem
    ).values_list("status", flat=True).first()
    if status:
        return status
    if orcamento and orcamento.status in {"Pendente", "Recusado"}:
        return "Aguardando aprovação"
    if orcamento and orcamento.status == "Aprovado":
        return "Agendado"
    return STATUS_INICIAL_OS


@require_GET
def ordens_cliente(request):
    if not request.user.is_authenticated:
        return JsonResponse({"erro": "Faça login para consultar suas ordens."}, status=401)
    try:
        cliente = request.user.conta_cliente.cliente
    except ContaCliente.DoesNotExist:
        return JsonResponse({"erro": "Esta conta não está vinculada a um cliente."}, status=403)

    ordens = (
        OrdemServico.objects
        .filter(id_cliente=cliente)
        .select_related("id_cliente", "id_tecnico")
        .order_by("-id_ordem_servico")
    )
    resultado = []
    for ordem in ordens:
        aparelho = Aparelho.objects.filter(id_ordem_servico=ordem).first()
        vinculos = (
            OsAgendamento.objects
            .filter(id_ordem_servico=ordem)
            .select_related("id_agendamento")
        )
        agendamentos = [
            {
                "id": vinculo.id_agendamento.id_agendamento,
                "data": vinculo.id_agendamento.data.isoformat(),
                "buscar": bool(vinculo.id_agendamento.buscar),
                "status": vinculo.id_agendamento.status,
            }
            for vinculo in vinculos
        ]
        orcamento = Orcamento.objects.filter(id_ordem_servico=ordem).first()
        itens = []
        if orcamento:
            itens = [
                {
                    "id_servico": item.id_servico_id,
                    "descricao": item.id_servico.descricao,
                    "quantidade": item.quantidade,
                    "mao_de_obra": str(item.mao_de_obra),
                    "custo_item": str(item.custo_item),
                }
                for item in (
                    ItemServico.objects
                    .filter(id_orcamento=orcamento)
                    .select_related("id_servico")
                )
            ]
        resultado.append({
            "id": ordem.id_ordem_servico,
            "numero_os": ordem.numero_os,
            "status": _status_ordem(ordem, orcamento),
            "cliente": {
                "id": cliente.id_cliente,
                "nome_completo": cliente.nome_completo,
                "cpf": cliente.cpf,
                "telefone": cliente.telefone,
            },
            "tecnico": {
                "id": ordem.id_tecnico.id_tecnico,
                "nome": ordem.id_tecnico.nome,
                "nivel": ordem.id_tecnico.nivel,
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


@require_POST
def responder_orcamento_cliente(request, os_id):
    if not request.user.is_authenticated:
        return JsonResponse({"erro": "Faça login para responder ao orçamento."}, status=401)
    try:
        cliente = request.user.conta_cliente.cliente
    except ContaCliente.DoesNotExist:
        return JsonResponse({"erro": "Esta conta não está vinculada a um cliente."}, status=403)

    dados, erro = _json_objeto(request)
    if erro:
        return erro
    resposta = dados.get("status")
    if not isinstance(resposta, str) or resposta not in {"Aprovado", "Recusado"}:
        return JsonResponse(
            {"erro": "A resposta deve ser 'Aprovado' ou 'Recusado'."},
            status=400,
        )

    ordem = OrdemServico.objects.filter(
        id_ordem_servico=os_id,
        id_cliente=cliente,
    ).select_related("id_tecnico").first()
    if ordem is None:
        return JsonResponse({"erro": "Ordem de serviço não encontrada."}, status=404)
    orcamento = Orcamento.objects.filter(id_ordem_servico=ordem).first()
    if orcamento is None:
        return JsonResponse({"erro": "Esta ordem ainda não possui orçamento."}, status=404)
    if orcamento.status != "Pendente":
        return JsonResponse(
            {"erro": "Só é possível responder a um orçamento pendente."},
            status=409,
        )
    if _status_ordem(ordem, orcamento) in {"Concluído", "Cancelado"}:
        return JsonResponse(
            {"erro": "Esta ordem de serviço já foi encerrada."},
            status=409,
        )
    if not ItemServico.objects.filter(id_orcamento=orcamento).exists():
        return JsonResponse({"erro": "O orçamento ainda não possui itens."}, status=409)

    with transaction.atomic():
        orcamento.status = resposta
        orcamento.save(update_fields=["status"])
        if resposta == "Aprovado":
            AcompanhamentoOrdem.objects.update_or_create(
                ordem_servico=ordem,
                defaults={"status": "Agendado"},
            )
    return JsonResponse({
        "orcamento": _dados_orcamento(orcamento),
        "status": _status_ordem(ordem, orcamento),
    })


@require_http_methods(["PATCH"])
def atualizar_status_os(request, os_id):
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

    dados, erro = _json_objeto(request)
    if erro:
        return erro
    novo_status = dados.get("status")
    status_validos = {opcao[0] for opcao in AcompanhamentoOrdem.STATUS_CHOICES}
    if not isinstance(novo_status, str) or novo_status not in status_validos:
        return JsonResponse({"erro": "Informe um status válido para a ordem."}, status=400)

    atual = _status_ordem(ordem)
    if novo_status not in TRANSICOES_STATUS_OS.get(atual, set()):
        return JsonResponse(
            {"erro": f"Não é permitido alterar '{atual}' para '{novo_status}'."},
            status=409,
        )
    if novo_status == "Em andamento":
        orcamento = Orcamento.objects.filter(id_ordem_servico=ordem).first()
        if orcamento is None or orcamento.status != "Aprovado":
            return JsonResponse(
                {"erro": "O reparo só pode começar após a aprovação do orçamento pelo cliente."},
                status=409,
            )

    AcompanhamentoOrdem.objects.update_or_create(
        ordem_servico=ordem,
        defaults={"status": novo_status},
    )
    return JsonResponse({"status": novo_status})


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


def _resolver_servico_orcamento(descricao):
    servico = (
        Servico.objects
        .filter(descricao__iexact=descricao)
        .order_by("id_servico")
        .first()
    )
    if servico is not None:
        return servico
    return Servico.objects.create(descricao=descricao, status="Ativo")


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

    if _status_ordem(ordem, orcamento) in {"Concluído", "Cancelado"}:
        return JsonResponse(
            {"erro": "Não é possível alterar o orçamento de uma ordem encerrada."},
            status=409,
        )

    if request.method == "DELETE":
        if orcamento is None:
            return HttpResponse(status=204)
        if orcamento.status not in {"Pendente", "Recusado"}:
            return JsonResponse(
                {"erro": "Só é possível editar um orçamento pendente."},
                status=409,
            )
        orcamento.delete()
        AcompanhamentoOrdem.objects.update_or_create(
            ordem_servico=ordem,
            defaults={"status": STATUS_INICIAL_OS},
        )
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
    if orcamento and orcamento.status not in {"Pendente", "Recusado"}:
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

        quantidade = item.get("quantidade")
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

        if "id_servico" in item:
            id_servico = item.get("id_servico")
            if isinstance(id_servico, bool) or not str(id_servico).isdigit():
                return JsonResponse(
                    {"erro": f"O item {indice + 1} precisa indicar um serviço válido."},
                    status=400,
                )
            referencia_servico = {"id_servico": int(id_servico)}
            ids_servico.append(int(id_servico))
        else:
            descricao = item.get("descricao_servico")
            if not isinstance(descricao, str) or not descricao.strip():
                return JsonResponse(
                    {"erro": f"Informe a descrição do serviço no item {indice + 1}."},
                    status=400,
                )
            descricao = descricao.strip()
            if len(descricao) > 150:
                return JsonResponse(
                    {"erro": f"A descrição do serviço no item {indice + 1} pode ter no máximo 150 caracteres."},
                    status=400,
                )
            referencia_servico = {"descricao_servico": descricao}

        mao, erro = _valor_monetario(item.get("mao_de_obra"), f"itens[{indice}].mao_de_obra")
        if erro:
            return JsonResponse({"erro": erro}, status=400)
        custo, erro = _valor_monetario(item.get("custo_item"), f"itens[{indice}].custo_item")
        if erro:
            return JsonResponse({"erro": erro}, status=400)

        itens_validados.append({
            **referencia_servico,
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

    try:
        with transaction.atomic():
            itens_com_servico = []
            ids_resolvidos = set()
            for item in itens_validados:
                servico = (
                    servicos[item["id_servico"]]
                    if "id_servico" in item
                    else _resolver_servico_orcamento(item["descricao_servico"])
                )
                if servico.id_servico in ids_resolvidos:
                    raise _ServicoDuplicadoNoOrcamento
                ids_resolvidos.add(servico.id_servico)
                itens_com_servico.append({
                    **item,
                    "servico": servico,
                })

            if orcamento is None:
                orcamento = Orcamento.objects.create(
                    id_ordem_servico=ordem,
                    status="Pendente",
                )
            else:
                orcamento.status = "Pendente"
                orcamento.save(update_fields=["status"])

            ItemServico.objects.filter(id_orcamento=orcamento).delete()
            ItemServico.objects.bulk_create([
                ItemServico(
                    id_orcamento=orcamento,
                    id_servico=item["servico"],
                    quantidade=item["quantidade"],
                    mao_de_obra=item["mao_de_obra"],
                    custo_item=item["custo_item"],
                )
                for item in itens_com_servico
            ])
            AcompanhamentoOrdem.objects.update_or_create(
                ordem_servico=ordem,
                defaults={"status": "Aguardando aprovação"},
            )
    except _ServicoDuplicadoNoOrcamento:
        return JsonResponse(
            {"erro": "Cada serviço pode aparecer uma única vez; ajuste a quantidade."},
            status=400,
        )

    return JsonResponse({"orcamento": _dados_orcamento(orcamento)})
