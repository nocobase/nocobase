---
title: "Hora"
description: "O campo de hora é usado para armazenar a hora do dia, como o horário de início do expediente e o horário de lembretes."
keywords: "hora,time,campo de hora,NocoBase"
---

# Hora

## Introdução

No NocoBase, **hora (Time)** é usada para armazenar a hora do dia.

O campo de hora é adequado para dados de negócio que não estão vinculados a uma data específica, como horário de funcionamento, horário de lembretes e períodos de turnos.

Se precisar armazenar a data e a hora ao mesmo tempo, escolha [data e hora](./datetime.md).

## Cenários aplicáveis

A hora é adequada para estes cenários de negócio:

- Horário de início e término do expediente
- Horário de lembretes diários
- Horário de início e término dos turnos
- Configuração de horários fixos

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Hora» para criar um campo de hora.

![20240512181216](https://static-docs.nocobase.com/20240512181216.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para hora, corresponde a `time` e determina como o valor é inserido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Horário de início», «Horário do lembrete» e «Horário de funcionamento». Recomenda-se usar um nome que as pessoas responsáveis pelo negócio compreendam diretamente. |
| Field name | Nome identificador do campo, usado em referências internas como API, campos de relação, permissões e fluxos de trabalho. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo de hora é `time`. |
| Default value | Valor padrão. Ao criar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. É possível configurar opções como preenchimento obrigatório e intervalo de tempo. |
| Description | Descrição do campo. Pode incluir o significado do campo, requisitos de preenchimento, origem dos dados ou responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajustes posteriores.

:::

## Características do campo

O comportamento padrão do campo de hora é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `time`. |
| Field type padrão | `time`. |
| Field type disponível | `time`. |
| Componente da página | O modo de edição usa um seletor de hora. |
| Filtragem | Suporta filtragem por hora, intervalo, vazio e não vazio. |
| Ordenação | Suporta ordenação por hora. |
| Validação | Suporta validações como preenchimento obrigatório e intervalo de tempo. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de hora. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, como alterar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada do banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | O nome identificador do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Os campos do banco de dados principal ou os campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Os campos do banco de dados principal ou os campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao criar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma como ele é usado nas variáveis de fluxo de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de hora. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de hora criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados já existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de hora é adequado para uso em formulários e configurações de regras.
![20260709232726](https://static-docs.nocobase.com/20260709232726.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Selecionar uma hora do dia. |
| Bloco de tabela | Exibir, ordenar e filtrar horários. |
| Bloco de filtro | Filtrar por intervalo de horário. |
| Fluxo de trabalho | Usar como campo de condição de horário. |

## Links relacionados

- [Campos](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Data](./date.md) — Armazenar apenas a data
- [Data e hora (com fuso horário)](./datetime.md) — Armazenar a data e a hora