# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Cliente(models.Model):
    id_cliente = models.AutoField(primary_key=True)
    nome_completo = models.CharField(max_length=120)
    cpf = models.CharField(unique=True, max_length=11)
    senha = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20)
    cep = models.CharField(max_length=8)
    numero = models.CharField(max_length=10)
    bairro = models.CharField(max_length=80)
    rua = models.CharField(max_length=150)
    cidade = models.CharField(max_length=80)
    referencia = models.CharField(max_length=150, blank=True, null=True)
    estado = models.CharField(max_length=2)

    class Meta:
        managed = False
        db_table = 'cliente'


class Tecnico(models.Model):
    id_tecnico = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=120)
    nivel = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'tecnico'


class Agendamento(models.Model):
    id_agendamento = models.AutoField(primary_key=True)
    status = models.CharField(max_length=15)
    data = models.DateTimeField()
    buscar = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'agendamento'


class Servico(models.Model):
    id_servico = models.AutoField(primary_key=True)
    descricao = models.CharField(max_length=150)
    status = models.CharField(max_length=15)

    class Meta:
        managed = False
        db_table = 'servico'


class OrdemServico(models.Model):
    id_ordem_servico = models.AutoField(primary_key=True)
    numero_os = models.CharField(unique=True, max_length=20)
    id_cliente = models.ForeignKey(Cliente, models.DO_NOTHING, db_column='id_cliente')
    id_tecnico = models.ForeignKey(Tecnico, models.DO_NOTHING, db_column='id_tecnico')

    class Meta:
        managed = False
        db_table = 'ordem_servico'


class OsAgendamento(models.Model):
    pk = models.CompositePrimaryKey('id_ordem_servico', 'id_agendamento')
    id_ordem_servico = models.ForeignKey(OrdemServico, models.DB_CASCADE, db_column='id_ordem_servico')
    id_agendamento = models.ForeignKey(Agendamento, models.DB_CASCADE, db_column='id_agendamento')

    class Meta:
        managed = False
        db_table = 'os_agendamento'


class Orcamento(models.Model):
    id_orcamento = models.AutoField(primary_key=True)
    id_ordem_servico = models.OneToOneField(OrdemServico, models.DO_NOTHING, db_column='id_ordem_servico')
    status = models.CharField(max_length=15)

    class Meta:
        managed = False
        db_table = 'orcamento'


class ItemServico(models.Model):
    pk = models.CompositePrimaryKey('id_orcamento', 'id_servico')
    id_orcamento = models.ForeignKey(Orcamento, models.DB_CASCADE, db_column='id_orcamento')
    id_servico = models.ForeignKey(Servico, models.DO_NOTHING, db_column='id_servico')
    quantidade = models.IntegerField()
    mao_de_obra = models.DecimalField(max_digits=10, decimal_places=2)
    custo_item = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'item_servico'


class Aparelho(models.Model):
    id_aparelho = models.AutoField(primary_key=True)
    id_ordem_servico = models.ForeignKey(OrdemServico, models.DB_CASCADE, db_column='id_ordem_servico')
    numero_serie = models.CharField(max_length=60, blank=True, null=True)
    observacao = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'aparelho'
