---
title: "Sequência"
description: "O campo de sequência é usado para gerar números comerciais incrementais ou gerados de acordo com regras."
keywords: "sequência,sequence,número, numeração automática,NocoBase"
---

# Sequência

## Introdução

No NocoBase, a **sequência (Sequence)** é usada para gerar números comerciais.

O campo de sequência é adequado para números de pedidos, contratos, ordens de serviço, solicitações e outros identificadores que exigem regras legíveis. Diferentemente da chave primária, ele é mais voltado à exibição comercial e à identificação manual.

Se você precisa apenas de um identificador interno exclusivo, use Snowflake ID, UUID ou Nano ID.

## Cenários de uso

A sequência é adequada para estes cenários comerciais:

- Números de pedidos e contratos
- Números de ordens de serviço e solicitações
- Identificadores de ativos e equipamentos
- Números com prefixos, datas ou regras incrementais

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Sequência» para criar um campo de sequência.

![20240512173752](https://static-docs.nocobase.com/20240512173752.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para sequências, corresponde a `sequence` e determina como o campo será preenchido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Número do pedido», «Número do contrato» ou «Número da ordem de serviço». Recomenda-se usar um nome que os usuários de negócio entendam diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relacionamento, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. O tipo de armazenamento do campo de sequência depende da regra da sequência; o mais comum é `string`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, um valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Normalmente geradas pelo sistema de acordo com as regras, sem necessidade de validação manual. |
| Description | Descrição do campo. É adequado registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Depois de criado, o nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de sequência é o seguinte:

| Característica | Descrição |
| --- | --- |
| Default Field interface | `sequence`. |
| Default Field type | `string`. |
| Field type opcional | `string`、`integer`, conforme a configuração real da sequência. |
| Componente da página | Normalmente gerado automaticamente e usado após a configuração da regra de numeração. |
| Filtragem | Permite consultar por correspondência exata do número ou filtrar por texto. |
| Ordenação | A adequação para ordenação depende da regra de numeração. |
| Validação | Depende da regra da sequência e normalmente mantém a exclusividade. |

## Edição da configuração

Depois de criar o campo, clique em «Edit» à direita dele para editar sua configuração. A edição do campo serve principalmente para ajustar como ele será exibido e usado no NocoBase, por exemplo, alterando o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapeando o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | O nome identificador do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, confirme se os dados existentes poderão ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão dos novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alterar o Field type ou o Field interface não equivale a simplesmente mudar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Exclusão do campo

Clique em «Delete» à direita do campo para excluir o campo de sequência. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de sequência criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração comercial.

:::

## Uso na configuração de páginas

O campo de sequência é adequado para cenários de numeração comercial e pesquisa manual.
![20260710151731](https://static-docs.nocobase.com/20260710151731.png)

| Cenário | Uso |
| --- | --- |
| Criação de registros | Gera automaticamente números comerciais. |
| Bloco de tabela | Exibe, pesquisa e filtra números. |
| Bloco de detalhes | Serve como identificador legível do registro. |
| Fluxos de trabalho e notificações | Faz referência ao número comercial em aprovações e notificações. |

## Links relacionados

- [Campos](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Texto de linha única](../data-modeling/collection-fields/basic/input.md) — Mantenha números comerciais manualmente
- [Snowflake ID](../data-modeling/collection-fields/advanced/snowflake-id.md) — Use um ID de chave primária interna