---
title: "Espaço"
description: "O campo de espaço é usado para identificar o espaço ao qual um registro pertence após a ativação do recurso de múltiplos espaços."
keywords: "Espaço,space,múltiplos espaços,campo do sistema,NocoBase"
---

# Espaço

## Introdução

No NocoBase, **espaço (Space)** é usado para registrar a qual espaço os dados pertencem.

O campo de espaço geralmente aparece após a ativação do plug-in de múltiplos espaços e é usado para isolar dados por espaço. Ele não é adequado para ser modificado livremente como um campo de negócio comum.

Se a necessidade for apenas representar departamentos, regiões ou projetos do negócio, recomenda-se criar um campo de relacionamento comum ou um campo de opções.

## Cenários aplicáveis

O espaço é adequado para estes cenários de negócio:

- Isolamento de dados entre múltiplos espaços
- Filtragem de dados por espaço
- Controle de permissões no nível do espaço
- Atribuição de dados em cenários de negócio multi-inquilino

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Espaço» para criar um campo de espaço.

![index-2025-11-01-00-50-45](https://static-docs.nocobase.com/index-2025-11-01-00-50-45.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para espaços, corresponde a `space` e determina como os dados são inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Espaço». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado internamente por APIs, campos de relacionamento, permissões, fluxos de trabalho e outros recursos. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Um campo de espaço normalmente é um campo de relacionamento que aponta para a tabela de espaços. |
| Default value | Valor padrão. Ao criar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Normalmente mantidas pelo sistema ou pelo contexto do espaço. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme o nome antes de criar o campo para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de espaço é o seguinte:

| Característica | Descrição |
| --- | --- |
| Default Field interface | `space`. |
| Default Field type | `belongsTo`. |
| Field type opcional | `belongsTo`. |
| Componentes da página | Mantidos pelo sistema ou pelo recurso de múltiplos espaços; normalmente são somente leitura na página ou usados de acordo com o contexto do espaço. |
| Filtragem | Permite filtrar por espaço, dependendo da configuração de múltiplos espaços. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Mantida pelo recurso de múltiplos espaços. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de espaço. A edição do campo é usada principalmente para ajustar sua exibição e utilização no NocoBase, como modificar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Modifica o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | O nome identificador do campo normalmente não pode ser modificado no formulário de edição após a criação. |
| Field interface | Sujeito a condições | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Sujeito a condições | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao criar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alterar o Field type ou o Field interface não equivale a simplesmente modificar um nome de exibição. Isso afetará a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma como as variáveis são usadas nos fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de espaço. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de espaço criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados já existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de espaço é adequado para cenários de isolamento de dados entre múltiplos espaços e de controle de permissões.

| Cenário | Uso |
| --- | --- |
| Bloco de tabela | Exibir o espaço ao qual o registro pertence. |
| Bloco de filtragem | Filtrar registros por espaço. |
| Permissões | Isolar o acesso aos dados por espaço. |
| Fluxo de trabalho | Ler o espaço ao qual o registro pertence como contexto. |

## Links relacionados

- [Campo](../index.md) — Saiba mais sobre a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Múltiplos espaços](../../../../multi-app/multi-space/index.md) — Saiba mais sobre o recurso de múltiplos espaços
- [Campo de relacionamento](../associations/index.md) — Crie um campo de relacionamento comum.