import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ordens", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ContaCliente",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "cliente",
                    models.OneToOneField(
                        db_column="id_cliente",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="conta",
                        to="ordens.cliente",
                    ),
                ),
                (
                    "usuario",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conta_cliente",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "ordens_conta_cliente",
            },
        ),
        migrations.CreateModel(
            name="AcompanhamentoOrdem",
            fields=[
                (
                    "ordem_servico",
                    models.OneToOneField(
                        db_column="id_ordem_servico",
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="acompanhamento",
                        serialize=False,
                        to="ordens.ordemservico",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("Aguardando triagem", "Aguardando triagem"),
                            ("Aguardando aprovação", "Aguardando aprovação"),
                            ("Agendado", "Agendado"),
                            ("Em andamento", "Em andamento"),
                            ("Concluído", "Concluído"),
                            ("Cancelado", "Cancelado"),
                        ],
                        max_length=30,
                    ),
                ),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "ordens_acompanhamento_ordem",
            },
        ),
    ]
