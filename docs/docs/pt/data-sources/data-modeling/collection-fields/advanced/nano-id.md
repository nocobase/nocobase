---
title: "Nano ID"
description: "O campo Nano ID é usado para gerar identificadores únicos aleatórios mais curtos."
keywords: "Nano ID,nanoid,identificador único,NocoBase"
---

# Nano ID

## Introdução

No NocoBase, o **Nano ID (Nano ID)** é usado para gerar IDs únicos aleatórios curtos.

O Nano ID é adequado para cenários que exigem identificadores de string mais curtos, como links curtos, números públicos e IDs de referência externa.

Se for usado como chave primária interna padrão, o Snowflake ID costuma ser mais direto. Se você precisa de um número comercial legível, escolha a [sequência](../../../field-sequence/index.md).

## Cenários de uso

O Nano ID é adequado para estes cenários comerciais:

- Identificadores de links curtos
- IDs de compartilhamento público
- Números de referência externa
- Strings únicas aleatórias mais curtas

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Nano ID» para criar um campo Nano ID.

![20240512173225](https://static-docs.nocobase.com/20240512173225.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. O Nano ID corresponde a `nanoId`, que determina como o campo será preenchido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «ID de compartilhamento», «ID público» ou «Identificador curto». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho e outros recursos. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. O Nano ID usa `string` por padrão. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser inserido automaticamente. |
| Validation rules | Normalmente geradas automaticamente pelo sistema, sem necessidade de validação manual. |
| Description | Descrição do campo. É apropriado registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Observação

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme a nomenclatura antes de criar o campo para evitar custos de ajustes posteriores.

:::

## Características do campo

O comportamento padrão do campo Nano ID é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `nanoId`. |
| Field type padrão | `string`. |
| Field type opcional | `string`. |
| Componente da página | Normalmente gerado automaticamente, sem necessidade de preenchimento manual. |
| Filtro | Permite consultas exatas por Nano ID. |
| Ordenação | Normalmente o Nano ID não é usado para ordenação comercial. |
| Validação | Normalmente gerada automaticamente e mantida como única. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo Nano ID. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e usado no NocoBase, por exemplo, alterando o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para um Field type e uma Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar seu nome identificador. |
| Field name | Não | O nome identificador do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suportado condicionalmente | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suportado condicionalmente | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Adiciona o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Observação

Trocar o Field type ou a Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo Nano ID. No banco de dados principal, também é possível selecionar vários campos e excluí-los em massa.

Ao excluir um campo Nano ID criado no banco de dados principal, normalmente a coluna real correspondente e os dados existentes nessa coluna também são excluídos do banco de dados. Ao excluir um campo sincronizado de um banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração comercial.

:::

## Uso na configuração de páginas

O campo Nano ID é adequado para identificadores públicos curtos e cenários de referência externa.
![20260710151321](https://static-docs.nocobase.com/20260710151321.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Normalmente não é editado manualmente, sendo gerado pelo sistema. |
| Bloco de detalhes | Exibe o identificador curto. |
| API | Usado como identificador público do registro. |
| Link externo | Usado como parte de um link curto ou de compartilhamento. |

## Links relacionados

- [Campo](../index.md) — Entenda a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Snowflake ID](./snowflake-id.md) — Use o ID interno padrão
- [UUID](./uuid.md) — Use UUID
- [Sequência](../../../field-sequence/index.md) — Gere números comerciais legíveis