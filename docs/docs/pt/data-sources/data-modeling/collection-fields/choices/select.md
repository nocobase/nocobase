---
title: "Seleção única suspensa"
description: "O campo de seleção única suspensa é usado para selecionar um valor entre opções predefinidas, sendo adequado para campos como status, nível e tipo."
keywords: "seleção única suspensa,select,campo de opções,NocoBase"
---

# Seleção única suspensa

## Introdução

No NocoBase, a **seleção única suspensa (Select)** é usada para selecionar um valor entre um conjunto de opções.

A seleção única suspensa é adequada para campos de negócio com valores fixos, como status, nível, tipo e origem. É possível configurar o nome de exibição, o valor e a cor de cada opção.

Se for necessário selecionar vários valores, escolha a [seleção múltipla suspensa](./multiple-select.md). Se houver apenas as opções sim ou não, escolha a [caixa de seleção](./checkbox.md).

## Cenários aplicáveis

A seleção única suspensa é adequada para os seguintes cenários de negócio:

- Status de pedidos, status de tickets e status de aprovação
- Nível do cliente, origem do lead e prioridade
- Tipo de projeto, categoria de ativo e tipo de contrato
- Campos dentro de um conjunto fixo de valores em que só é possível selecionar um valor

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Seleção única suspensa» para criar um campo de seleção única suspensa.

![20240512180203](https://static-docs.nocobase.com/20240512180203.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. A seleção única suspensa corresponde a `select`, que determina como os dados são inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Status do pedido», «Nível do cliente» e «Prioridade». Recomenda-se usar um nome que os usuários de negócio compreendam diretamente. |
| Field name | Nome identificador do campo, usado em referências internas como API, campos de relação, permissões e fluxos de trabalho. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, a seleção única suspensa é `string`, que armazena o valor da opção selecionada. |
| Default value | Valor padrão. Ao adicionar um registro, o valor padrão pode ser preenchido automaticamente caso o usuário não informe nenhum valor. |
| Validation rules | Regras de validação. Normalmente, são configuradas para exigir o preenchimento e manter os valores das opções. |
| Description | Descrição do campo. Pode conter o significado do campo, requisitos de preenchimento, origem dos dados ou responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme a nomenclatura antes de criar o campo para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de seleção única suspensa é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `select`. |
| Field type padrão | `string`. |
| Field type disponível | `string`. |
| Componente da página | No modo de edição, é usado um seletor suspenso. |
| Filtragem | Permite filtrar por opção. |
| Ordenação | Permite ordenar pelo valor da opção. |
| Validação | Permite exigir o preenchimento e restringir o conjunto de opções. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de seleção única suspensa. A edição do campo é usada principalmente para ajustar como ele é exibido e utilizado no NocoBase, por exemplo, alterando o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente será feita como um mapeamento de campo — mapeando o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alterar o Field type ou o Field interface não equivale a simplesmente modificar um nome de exibição. Isso afetará a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de seleção única suspensa. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de seleção única suspensa criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de seleção única suspensa é adequado para uso em formulários, tabelas, quadros e filtros.
![20260709225912](https://static-docs.nocobase.com/20260709225912.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Selecionar um valor nas opções suspensas. |
| Bloco de tabela | Exibir a opção como etiqueta ou texto. |
| Bloco de quadro | Agrupar por opções como status e etapa. |
| Bloco de filtro | Filtrar registros rapidamente por opção. |

## Links relacionados

- [Campos](../index.md) — Entenda a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Seleção múltipla suspensa](./multiple-select.md) — Selecione vários valores entre as opções
- [Grupo de botões de opção](./radio-group.md) — Selecione um valor usando um grupo de botões
