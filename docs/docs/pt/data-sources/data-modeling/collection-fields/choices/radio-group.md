---
title: "Grupo de opções de rádio"
description: "O campo de grupo de opções de rádio é usado para exibir opções lado a lado na página e selecionar um único valor entre elas."
keywords: "grupo de opções de rádio,radio group,campo de opções,NocoBase"
---

# Grupo de opções de rádio

## Introdução

No NocoBase, o **grupo de opções de rádio (Radio group)** é usado para selecionar um único valor entre um conjunto de opções e exibir essas opções diretamente no formulário.

O grupo de opções de rádio é adequado para cenários com poucas opções, quando é necessário permitir que o usuário veja todas elas de imediato. Ele é semelhante à seleção única em lista suspensa; a principal diferença está na forma de interação na página.

Se houver muitas opções, use a [seleção única em lista suspensa](./select.md) para economizar espaço. Para permitir várias seleções, use o [grupo de caixas de seleção](./checkbox-group.md).

## Cenários aplicáveis

O grupo de opções de rádio é adequado para os seguintes cenários de negócio:

- Prioridade: baixa, média e alta
- Opções de extensão para sexo, tipo e sim/não
- Resultado da aprovação: aprovado, rejeitado
- Seleção rápida de poucas opções fixas

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Grupo de opções de rádio» para criar um campo de grupo de opções de rádio.
![20260709231205](https://static-docs.nocobase.com/20260709231205.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. O grupo de opções de rádio corresponde a `radioGroup` e determina como os dados serão inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Prioridade», «Resultado da aprovação» ou «Tipo». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em API, campos de relacionamento, permissões, fluxos de trabalho e outros recursos. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o grupo de opções de rádio é `string` e armazena o valor da opção selecionada. |
| Default value | Valor padrão. Ao adicionar um registro, o valor padrão pode ser preenchido automaticamente se o usuário não informar nenhum valor. |
| Validation rules | Regras de validação. Normalmente, são configuradas como obrigatórias e mantêm os valores das opções. |
| Description | Descrição do campo. Pode incluir o significado do campo, requisitos de preenchimento, origem dos dados ou responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajustes de configuração posteriores.

:::

## Características do campo

O comportamento padrão do campo de grupo de opções de rádio é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `radioGroup`. |
| Field type padrão | `string`. |
| Field type disponível | `string`. |
| Componente da página | No modo de edição, usa um grupo de opções de rádio. |
| Filtro | Permite filtrar por opção. |
| Ordenação | Permite ordenar pelo valor da opção. |
| Validação | Permite torná-lo obrigatório e restringir o conjunto de opções. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de grupo de opções de rádio. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, por exemplo, para alterar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Condicionalmente | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Condicionalmente | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, confirme se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

A troca de Field type ou Field interface não equivale simplesmente a alterar um nome exibido. Ela afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de grupo de opções de rádio. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de grupo de opções de rádio criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nela também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração da página

O grupo de opções de rádio é adequado para exibir poucas opções lado a lado em um formulário.
![20260709230347](https://static-docs.nocobase.com/20260709230347.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Exibe diretamente todas as opções e permite selecionar uma. |
| Bloco de detalhes | Exibe a opção selecionada. |
| Bloco de filtro | Filtra os registros por opção. |
| Fluxos de trabalho e permissões | Participa de decisões como condição de status, tipo e outros valores. |

## Links relacionados

- [Campos](../index.md) — Saiba mais sobre a finalidade, as categorias e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Seleção única em lista suspensa](./select.md) — Use quando houver muitas opções
- [Grupo de caixas de seleção](./checkbox-group.md) — Selecione vários valores