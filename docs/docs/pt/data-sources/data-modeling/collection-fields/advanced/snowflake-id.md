---
title: "Snowflake ID"
description: "O campo Snowflake ID é usado para gerar IDs Snowflake de 53 bits e costuma ser usado como chave primária padrão."
keywords: "Snowflake ID,snowflakeId,chave primária,NocoBase"
---

# Snowflake ID

## Introdução

No NocoBase, **Snowflake ID (Snowflake ID)** é usado para gerar identificadores exclusivos.

Snowflake ID é um tipo de chave primária comumente usado no campo de ID padrão das tabelas comuns do NocoBase. Ele é adequado como identificador exclusivo interno dos registros.

Se precisar de um número legível por sistemas externos, use a [sequência](../../../field-sequence/index.md) ou um campo de número de negócio.

## Cenários aplicáveis

Snowflake ID é adequado para estes cenários de negócio:

- Chave primária padrão de tabelas comuns
- ID de registros internos
- Tabelas de negócio que precisam gerar IDs exclusivos com alto desempenho
- Identificadores exclusivos que não precisam ser reconhecidos manualmente

## Configuração de criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Snowflake ID» para criar um campo Snowflake ID.

![20251209204217](https://static-docs.nocobase.com/20251209204217.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Snowflake ID corresponde a `snowflakeId`, determinando como os dados são inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «ID», «ID do registro» ou «ID interno». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em API, campos de relacionamento, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Snowflake ID normalmente usa `bigInt`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Normalmente geradas automaticamente pelo sistema, sem necessidade de validação manual. |
| Description | Descrição do campo. É adequado registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Após a criação, o nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme o nome antes da criação para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo Snowflake ID é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `snowflakeId`. |
| Field type padrão | `bigInt`. |
| Field type opcional | `bigInt`. |
| Componente da página | Normalmente gerado automaticamente, sem necessidade de inserção manual. |
| Filtragem | Permite consultas exatas por ID. |
| Ordenação | Permite ordenar. |
| Validação | Normalmente gerada automaticamente e mantida como exclusiva. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo Snowflake ID. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, por exemplo, alterando o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer o mapeamento do campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | O nome identificador do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo Snowflake ID. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo Snowflake ID criado no banco de dados principal, normalmente a coluna real correspondente e os dados existentes nessa coluna também são excluídos do banco de dados. Ao excluir um campo sincronizado de um banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo Snowflake ID é adequado como chave primária e identificador exclusivo interno.
![20260710145423](https://static-docs.nocobase.com/20260710145423.png)

| Cenário | Uso |
| --- | --- |
| Criar tabela | Usado como campo de ID padrão. |
| Campo de relacionamento | Usado como identificador exclusivo do registro relacionado. |
| API | Usado para localizar um único registro. |
| Permissões e fluxos de trabalho | Participa do processamento interno como identificador exclusivo do registro. |

## Links relacionados

- [Campo](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em tabelas comuns
- [UUID](./uuid.md) — Use UUID como identificador exclusivo
- [Nano ID](./nano-id.md) — Use IDs curtos
- [Sequência](../../../field-sequence/index.md) — Gere números de negócio
