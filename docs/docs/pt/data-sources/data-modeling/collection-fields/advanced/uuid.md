---
title: "UUID"
description: "O campo UUID é usado para gerar identificadores universalmente exclusivos, sendo adequado para sincronização com sistemas externos e cenários de identificação pública."
keywords: "UUID,identificador exclusivo,chave primária,NocoBase"
---

# UUID

## Introdução

No NocoBase, **UUID (UUID)** é usado para gerar identificadores exclusivos do tipo UUID.

UUID é adequado para cenários como sincronização entre sistemas, identificação em APIs públicas e importação e exportação. Ele expõe menos facilmente o volume de dados do que um ID autoincremental.

Se a finalidade for apenas usar a chave primária padrão internamente no NocoBase, o Snowflake ID geralmente é suficiente. Se precisar de um número curto, escolha [Nano ID](./nano-id.md) ou [sequência](../../../field-sequence/index.md).

## Cenários aplicáveis

UUID é adequado para estes cenários de negócio:

- ID de sincronização com sistemas externos
- Identificador de API pública
- Identificador de registros migrados entre bancos de dados
- ID de registros cujo padrão incremental não deve ser exposto

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «UUID» para criar um campo UUID.

![20240512173354](https://static-docs.nocobase.com/20240512173354.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. UUID corresponde a `uuid`, que determina como os dados serão inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «UUID», «Identificador externo» ou «ID público». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho e outros recursos. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo UUID é `uuid`. |
| Default value | Valor padrão. Ao adicionar um registro, o valor padrão pode ser preenchido automaticamente se o usuário não informar um valor. |
| Validation rules | Normalmente geradas automaticamente pelo sistema, sem necessidade de validação manual. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, requisitos de preenchimento, origem dos dados ou responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme a nomenclatura antes de criar o campo para evitar custos de ajustes posteriores.

:::

## Características do campo

O comportamento padrão do campo UUID é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `uuid`. |
| Field type padrão | `uuid`. |
| Field type opcional | `uuid`. |
| Componente da página | Normalmente gerado automaticamente, sem necessidade de inserção manual. |
| Filtro | Permite consultas exatas por UUID. |
| Ordenação | Permite ordenação, mas normalmente o UUID não é usado para ordenação de negócio. |
| Validação | Normalmente gerada automaticamente e mantida como exclusiva. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo UUID. A edição é usada principalmente para ajustar a forma como o campo é exibido e utilizado no NocoBase, por exemplo, alterando o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer o mapeamento do campo — mapeando o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome de exibição do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. O ajuste afeta a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a maneira como as variáveis são usadas nos fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo UUID. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo UUID criado no banco de dados principal, normalmente a coluna real correspondente e os dados existentes nessa coluna também serão excluídos do banco de dados. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importação e exportação, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração da página

O campo UUID é adequado para uso em cenários de integração e identificação pública.
![20260710145759](https://static-docs.nocobase.com/20260710145759.png)

| Cenário | Finalidade |
| --- | --- |
| Criar tabela | Usar como chave primária ou identificador exclusivo. |
| API | Usar como identificador público de registros. |
| Sincronização de dados | Sincronizar registros entre sistemas. |
| Importação e exportação | Manter a exclusividade dos registros. |

## Links relacionados

- [Campos](../index.md) — Entenda a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Snowflake ID](./snowflake-id.md) — Use o Snowflake ID padrão
- [Nano ID](./nano-id.md) — Use um ID aleatório curto