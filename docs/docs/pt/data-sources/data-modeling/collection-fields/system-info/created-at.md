---
title: "Data de criação"
description: "O campo de data de criação é usado para registrar automaticamente o momento de criação de um registro."
keywords: "data de criação,createdAt,campo do sistema,NocoBase"
---

# Data de criação

## Introdução

No NocoBase, **Data de criação (Created at)** é usada para registrar automaticamente o momento de criação de um registro.

A data de criação geralmente é gerada por um campo predefinido. Ela é adequada para ordenação, filtragem, auditoria, condições de fluxo de trabalho e estatísticas de dados.

Se precisar preencher manualmente uma data de negócio, como a data de assinatura do contrato ou a data de vencimento, use [Data](../datetime/date.md) ou [Data e hora](../datetime/datetime.md).

## Cenários aplicáveis

A data de criação é adequada para estes cenários de negócio:

- Ordenar por momento de criação
- Filtrar dados criados em um determinado período
- Auditar o momento de criação dos registros
- Determinar em um fluxo de trabalho o momento de criação de um novo registro

## Configuração de criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Data de criação» para criar um campo de data de criação.

![20240512174347](https://static-docs.nocobase.com/20240512174347.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. A data de criação corresponde a `createdAt`, que determina como os dados são inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Data de criação» ou «Momento de criação». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. A data de criação normalmente usa `date`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, um valor padrão poderá ser inserido automaticamente. |
| Validation rules | Mantido automaticamente pelo sistema; normalmente não requer validação manual. |
| Description | Descrição do campo. É adequado incluir o significado do campo, requisitos de preenchimento, fonte dos dados ou responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme o nome antes de criar o campo para evitar custos de ajustes de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de data de criação é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `createdAt`. |
| Field type padrão | `date`. |
| Field type opcional | `date`. |
| Componente da página | Preenchido automaticamente pelo sistema; normalmente é exibido como somente leitura na página. |
| Filtragem | Permite filtrar por data e intervalo. |
| Ordenação | Permite ordenar por data. |
| Validação | Preenchida automaticamente pelo sistema. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de data de criação. A edição do campo serve principalmente para ajustar como ele é exibido e usado no NocoBase, por exemplo, alterando o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente envolve o mapeamento do campo — mapeando o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a fonte dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alterar o Field type ou o Field interface não equivale a simplesmente mudar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de data de criação. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de data de criação recém-criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados já existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por configurações de negócio.

:::

## Uso na configuração da página

O campo de data de criação é adequado para uso em listas, detalhes, filtros e auditorias.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Cenário | Finalidade |
| --- | --- |
| Bloco de tabela | Exibir e ordenar por momento de criação. |
| Bloco de filtro | Filtrar registros criados em um determinado período. |
| Bloco de detalhes | Consultar o momento de criação do registro. |
| Fluxo de trabalho | Participar da avaliação como condição de tempo. |

## Links relacionados

- [Campos](../index.md) — Saiba mais sobre a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Data e hora (com fuso horário)](../datetime/datetime.md) — Armazenar horários de negócio
- [Data de atualização](./updated-at.md) — Registrar automaticamente o momento de atualização
