---
title: "Grupo de caixas de seleção"
description: "O campo de grupo de caixas de seleção exibe várias opções lado a lado na página e permite selecionar vários valores."
keywords: "grupo de caixas de seleção,checkbox group,múltipla seleção,campo de opções,NocoBase"
---

# Grupo de caixas de seleção

## Introdução

No NocoBase, o **grupo de caixas de seleção (Checkbox group)** é usado para selecionar vários valores de um conjunto de opções e exibir essas opções diretamente no formulário.

O grupo de caixas de seleção é adequado para cenários com poucas opções que exigem múltipla seleção. Ele é semelhante à seleção múltipla em lista suspensa, mas a principal diferença está na forma de interação na página.

Se houver muitas opções, escolha a [seleção múltipla em lista suspensa](./multiple-select.md) para economizar espaço. Se só for possível selecionar uma opção, escolha o [grupo de botões de opção](./radio-group.md).

## Situações aplicáveis

O grupo de caixas de seleção é adequado para os seguintes cenários de negócio:

- escopo de serviço, canais aplicáveis
- permissões de funcionalidade a serem marcadas
- rótulos de necessidades dos clientes
- poucas opções fixas de múltipla seleção

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Grupo de caixas de seleção» para criar um campo de grupo de caixas de seleção.
![20260709231244](https://static-docs.nocobase.com/20260709231244.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. O grupo de caixas de seleção corresponde a `checkboxGroup`, que determina como os dados serão inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Escopo de serviço», «Canais aplicáveis» ou «Rótulos de necessidades». Recomenda-se usar um nome que os profissionais de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em API, campos de relação, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. O grupo de caixas de seleção normalmente é armazenado como um array ou JSON, conforme a configuração do campo e os recursos da fonte de dados. |
| Default value | Valor padrão. Ao adicionar um registro, o valor padrão pode ser preenchido automaticamente se o usuário não informar nenhum valor. |
| Validation rules | Regras de validação. Normalmente são configuradas como obrigatoriedade e intervalo de opções. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme a nomenclatura antes de criar o campo para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de grupo de caixas de seleção é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `checkboxGroup`. |
| Field type padrão | `array`. |
| Field type disponível | `array` e `json`, conforme o mapeamento real do campo. |
| Componente da página | O modo de edição utiliza um grupo de caixas de seleção. |
| Filtragem | Permite filtrar por registros que contenham uma determinada opção. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Permite restrições de obrigatoriedade e do intervalo de opções. |

## Edição da configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de grupo de caixas de seleção. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, por exemplo, para alterar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consistirá em fazer o mapeamento do campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes podem ser utilizados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de utilização das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Exclusão do campo

Clique em «Delete» à direita do campo para excluir o campo de grupo de caixas de seleção. No banco de dados principal, também é possível marcar vários campos e excluí-los em lote.

Ao excluir um campo de grupo de caixas de seleção criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração da página

O grupo de caixas de seleção é adequado para exibir lado a lado poucas opções de múltipla seleção em formulários.
![20260709230421](https://static-docs.nocobase.com/20260709230421.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Exibe diretamente todas as opções e permite selecionar várias. |
| Bloco de detalhes | Exibe várias opções como etiquetas ou texto. |
| Bloco de filtro | Filtra por registros que contenham determinadas opções. |
| Fluxos de trabalho e permissões | Participa de condições como contém ou não contém. |

## Links relacionados

- [Campos](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabelas comuns](../../../data-source-main/general-collection.md) — Crie e gerencie campos em tabelas comuns
- [Seleção múltipla em lista suspensa](./multiple-select.md) — Use quando houver muitas opções
- [Grupo de botões de opção](./radio-group.md) — Selecione um valor
