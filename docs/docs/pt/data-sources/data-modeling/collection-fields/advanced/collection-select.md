---
title: "Seletor de tabelas"
description: "O campo seletor de tabelas é usado para selecionar tabelas de dados no NocoBase."
keywords: "seletor de tabelas,collection select,Collection,NocoBase"
---

# Seletor de tabelas

## Introdução

No NocoBase, o **seletor de tabelas (Collection select)** é usado para selecionar uma ou mais tabelas de dados.

O seletor de tabelas é adequado para cenários como configuração de plugins, configuração de regras e gerenciamento de metadados. Ele armazena o identificador da tabela de dados, não registros de negócio.

Se quiser selecionar registros de uma determinada tabela, use um campo de relação em vez do seletor de tabelas.

## Cenários aplicáveis

O seletor de tabelas é adequado para os seguintes cenários de negócio:

- Selecionar a tabela de destino na configuração de plugins
- Especificar o escopo de tabelas na configuração de regras
- Gerenciamento de metadados e configuração de modelos
- Configurações de funcionalidades que precisam referenciar identificadores de Collection

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Seletor de tabelas» para criar um campo seletor de tabelas.

![20240512174047](https://static-docs.nocobase.com/20240512174047.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. O seletor de tabelas corresponde a `collectionSelect`, que determina como os dados são inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Tabela de destino», «Tabela-alvo» ou «Escopo de dados». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em API, campos de relação, permissões, workflows e outros recursos. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. O seletor de tabelas normalmente armazena o identificador da tabela de dados; o tipo de armazenamento depende da configuração real. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. Normalmente são configuradas regras de preenchimento obrigatório ou de escopo de seleção. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, workflows e APIs após a criação. Confirme a nomenclatura antes de criar o campo para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo seletor de tabelas é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `collectionSelect`. |
| Field type padrão | `string`. |
| Field type disponível | `string`, `json`, conforme a configuração real. |
| Componente da página | O modo de edição usa o componente de seleção de tabelas. |
| Filtragem | Normalmente não é usado como campo de filtragem de negócio. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Oferece suporte a validações básicas, como preenchimento obrigatório. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo seletor de tabelas. A edição do campo é usada principalmente para ajustar sua forma de exibição e utilização no NocoBase, como modificar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Modifica o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser modificado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes poderão ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afetará a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de utilização das variáveis em workflows. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo seletor de tabelas. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo seletor de tabelas criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados já existentes nessa coluna também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o escopo do impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão do campo pode afetar blocos de página, formulários, filtros, permissões, workflows, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O seletor de tabelas é adequado para uso em formulários de configuração.

| Cenário | Finalidade |
| --- | --- |
| Bloco de formulário | Selecionar uma ou mais tabelas de dados. |
| Bloco de detalhes | Exibir as tabelas de dados selecionadas. |
| Configuração de plugin | Especificar o escopo de tabelas de dados ao qual a funcionalidade se aplica. |
| Workflow ou regra | Participar da lógica como configuração de metadados. |

## Links relacionados

- [Campos](../index.md) — Saiba mais sobre a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabelas comuns](../../../data-source-main/general-collection.md) — Crie e gerencie campos em tabelas comuns
- [Tabelas comuns](../../../data-source-main/general-collection.md) — Saiba mais sobre como usar Collections
- [Campos de relação](../associations/index.md) — Selecione registros de uma determinada tabela