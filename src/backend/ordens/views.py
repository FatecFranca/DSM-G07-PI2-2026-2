from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from .models import Tecnico
import json
from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods

from .models import Tecnico

@require_GET
def listar_tecnicos(request):
    tecnicos = list(
        Tecnico.objects
        .values("id_tecnico", "nome", "nivel")
        .order_by("nome")
    )
    return JsonResponse({"tecnicos": tecnicos})

def ler_payload(request, parcial=False):
    try:
        dados = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, "O corpo precisa ser um JSON válido."

    if not isinstance(dados, dict):
        return None, "Envie um objeto JSON."

    permitidos = {"nome", "nivel"}
    extras = set(dados) - permitidos
    if extras:
        return None, f"Campos não permitidos: {', '.join(sorted(extras))}."

    if not parcial and not {"nome", "nivel"}.issubset(dados):
        return None, "Os campos nome e nivel são obrigatórios."

    if parcial and not dados:
        return None, "Informe ao menos um campo para atualizar."

    limpos = {}
    limites = {"nome": 120, "nivel": 20}

    for campo, limite in limites.items():
        if campo not in dados:
            continue

        valor = dados[campo]
        if not isinstance(valor, str) or not valor.strip():
            return None, f"O campo {campo} precisa ser um texto não vazio."
        if len(valor.strip()) > limite:
            return None, f"O campo {campo} aceita no máximo {limite} caracteres."

        limpos[campo] = valor.strip()

    return limpos, None


@require_GET
def csrf_token(request):
    return JsonResponse({"ok": True})


csrf_token = ensure_csrf_cookie(csrf_token)


@require_http_methods(["GET", "POST"])
def tecnicos(request):
    if request.method == "GET":
        registros = list(
            Tecnico.objects
            .values("id_tecnico", "nome", "nivel")
            .order_by("nome")
        )
        return JsonResponse({"tecnicos": registros})

    dados, erro = ler_payload(request)
    if erro:
        return JsonResponse({"erro": erro}, status=400)

    tecnico = Tecnico.objects.create(**dados)
    return JsonResponse(
        {
            "tecnico": {
                "id_tecnico": tecnico.id_tecnico,
                "nome": tecnico.nome,
                "nivel": tecnico.nivel,
            }
        },
        status=201,
    )


@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def tecnico_por_id(request, id_tecnico):
    try:
        tecnico = Tecnico.objects.get(pk=id_tecnico)
    except Tecnico.DoesNotExist:
        return JsonResponse({"erro": "Técnico não encontrado."}, status=404)

    if request.method == "GET":
        return JsonResponse({
            "tecnico": {
                "id_tecnico": tecnico.id_tecnico,
                "nome": tecnico.nome,
                "nivel": tecnico.nivel,
            }
        })

    if request.method == "DELETE":
        try:
            with transaction.atomic():
                tecnico.delete()
        except (IntegrityError, ProtectedError):
            return JsonResponse(
                {"erro": "Não é possível excluir: o técnico está associado a uma ordem de serviço."},
                status=409,
            )
        return HttpResponse(status=204)

    dados, erro = ler_payload(request, parcial=request.method == "PATCH")
    if erro:
        return JsonResponse({"erro": erro}, status=400)

    for campo, valor in dados.items():
        setattr(tecnico, campo, valor)

    tecnico.save(update_fields=list(dados))
    return JsonResponse({
        "tecnico": {
            "id_tecnico": tecnico.id_tecnico,
            "nome": tecnico.nome,
            "nivel": tecnico.nivel,
        }
    })