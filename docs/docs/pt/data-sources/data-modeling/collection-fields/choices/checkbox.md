---
title: "Caixa de seleção"
description: "O campo de caixa de seleção é usado para armazenar valores booleanos, como sim ou não, ativado ou desativado."
keywords: "caixa de seleção,checkbox,valor booleano,boolean,NocoBase"
---

# Caixa de seleção

## Introdução

No NocoBase, a **caixa de seleção (Checkbox)** é usada para armazenar valores booleanos de duas opções.

O campo de caixa de seleção é adequado para indicar status de ativação, valor padrão, conclusão, necessidade de aprovação e outras verificações simples. Sua semântica é mais clara do que armazenar “sim/não” como texto.

Se o status tiver mais de dois valores, como rascunho, em andamento e concluído, é mais adequado escolher o [seletor suspenso de escolha única](./select.md).

## Cenários aplicáveis

A caixa de seleção é adequada para estes cenários de negócio:

- Ativado ou não, padrão ou não
- Concluído ou não, lido ou não
- Requer aprovação ou não, faturado ou não
- Público ou não, arquivado ou não

## Criar configuração

Na página「Configure fields」da tabela de dados, clique em「Add field」e selecione「Caixa de seleção」para criar um campo de caixa de seleção.

![20240512180122](https://static-docs.nocobase.com/20240512180122.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. A caixa de seleção corresponde a `checkbox`, que determina como o campo será preenchido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como「Ativado?」「Concluído?」「Faturado?」. Recomenda-se usar um nome que os profissionais de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado em referências internas como API, campos de relacionamento, permissões e fluxos de trabalho. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo de caixa de seleção é `boolean`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser inserido automaticamente. |
| Validation rules | Regras de validação. Normalmente são configuradas como obrigatoriedade ou valor padrão. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, requisitos de preenchimento, origem dos dados ou responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme a nomenclatura antes de criar o campo para evitar custos de ajustes posteriores.

:::

## Características do campo

O comportamento padrão do campo de caixa de seleção é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `checkbox`. |
| Field type padrão | `boolean`. |
| Field type disponível | `boolean`. |
| Componente da página | No modo de edição, usa uma caixa de seleção. |
| Filtros | Permite filtrar por sim, não ou vazio. |
| Ordenação | Permite ordenar por valor booleano. |
| Validação | Permite configurações básicas, como obrigatoriedade e valor padrão. |

## Editar configuração

Após a criação, clique em「Edit」à direita do campo para editar a configuração do campo de caixa de seleção. A edição do campo é usada principalmente para ajustar sua exibição e forma de uso no NocoBase, como modificar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada do banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Modifica o nome exibido do campo na interface, sem alterar seu nome identificador. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Isso afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em「Delete」à direita do campo para excluir o campo de caixa de seleção. No banco de dados principal, também é possível selecionar vários campos e excluí-los em massa.

Ao excluir um campo de caixa de seleção criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados já existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de caixa de seleção é adequado para uso em formulários, tabelas, filtros e condições de fluxos de trabalho.
![20260709225738](https://static-docs.nocobase.com/20260709225738.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Inserir sim ou não. |
| Bloco de tabela | Exibir o status da caixa de seleção e permitir filtragem. |
| Bloco de filtro | Filtrar por condições como ativado ou não e concluído ou não. |
| Fluxos de trabalho e permissões | Participar de decisões como condição booleana. |

## Links relacionados

- [Campos](../index.md) — Entenda a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Seletor suspenso de escolha única](./select.md) — Armazene um valor entre vários estados
- [Grupo de botões de opção](./radio-group.md) — Exiba opções como botões de escolha única