---
title: "Atualizado por"
description: "O campo Atualizado por é usado para registrar automaticamente o usuário que atualizou o registro pela última vez."
keywords: "Atualizado por,updatedBy,campo do sistema,usuário,NocoBase"
---

# Atualizado por

## Introdução

No NocoBase, **Atualizado por (Updated by)** é usado para registrar automaticamente o usuário que atualizou o registro pela última vez.

O campo Atualizado por geralmente é criado por meio de um campo predefinido. Ele é adequado para auditoria, rastreamento de responsabilidades, filtragem e condições de fluxo de trabalho.

Para representar o responsável pelo negócio, o responsável pelo processamento ou o aprovador, recomenda-se criar separadamente um campo de relação com usuário.

## Cenários de uso

O campo Atualizado por é adequado para os seguintes cenários:

- Verificar quem fez a última manutenção
- Filtrar registros por usuário que atualizou
- Auditar quem modificou os dados
- Notificar o último usuário que atualizou em um fluxo de trabalho

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Atualizado por» para criar um campo Atualizado por.

![index-2025-11-01-00-51-12](https://static-docs.nocobase.com/index-2025-11-01-00-51-12.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para Atualizado por, corresponde a `updatedBy`, que determina como o valor será inserido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Atualizado por» ou «Último usuário a modificar». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado em referências internas por API, campos de relação, permissões, fluxos de trabalho etc. Geralmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Atualizado por normalmente é um campo de relação `belongsTo` que aponta para a tabela de usuários. |
| Default value | Valor padrão. Ao criar um novo registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Mantido automaticamente pelo sistema; normalmente não requer validação manual. |
| Description | Descrição do campo. É adequado informar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de reconfiguração posteriormente.

:::

## Características do campo

O comportamento padrão do campo Atualizado por é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `updatedBy`. |
| Field type padrão | `belongsTo`. |
| Field type disponível | `belongsTo`. |
| Componente da página | Preenchido automaticamente pelo sistema; na página, normalmente é apresentado por meio de um componente de exibição de usuário. |
| Filtragem | Permite filtrar por usuário. |
| Ordenação | Normalmente não é feita por usuário que atualizou. |
| Validação | Preenchida automaticamente pelo sistema. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo Atualizado por. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, como alterar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | O nome identificador do campo geralmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afeta a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo Atualizado por. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo Atualizado por criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também são excluídos. Ao excluir um campo sincronizado de um banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importação e exportação, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo Atualizado por é adequado para uso em auditorias, filtros e fluxos de trabalho.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Cenário | Uso |
| --- | --- |
| Bloco de tabela | Exibir o usuário que atualizou por último. |
| Bloco de filtragem | Filtrar registros pelo usuário que atualizou. |
| Bloco de detalhes | Verificar quem fez a última manutenção. |
| Fluxo de trabalho | Usar como destinatário de notificações ou campo de condição. |

## Links relacionados

- [Campos](../index.md) — Saiba mais sobre a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Criado por](./created-by.md) — Registrar automaticamente o usuário que criou o registro
- [Campo de relação](../associations/index.md) — Criar relações com usuários, como o responsável pelo negócio
