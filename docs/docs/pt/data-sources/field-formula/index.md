---
title: "Fórmula"
description: "O campo de fórmula é usado para calcular resultados com base em outros campos, como valores, pontuações, textos de status etc."
keywords: "Fórmula,formula,campo calculado,NocoBase"
---

# Fórmula

## Introdução

No NocoBase, **fórmula (Formula)** é usada para calcular valores de campos com base em expressões.

Os campos de fórmula são adequados para cenários como cálculos de valores, pontuações, concatenação de textos e cálculos condicionais. Seus valores geralmente são gerados por expressões, não sendo adequados para inserção manual direta.

Se o resultado precisar ser preenchido manualmente, escolha o campo básico correspondente. Se a lógica de cálculo for muito complexa, considere usar um fluxo de trabalho ou uma visualização de banco de dados.

## Cenários aplicáveis

As fórmulas são adequadas para estes cenários de negócio:

- Subtotal do pedido e valor com impostos
- Pontuação, pontuação ponderada e pontuação de desempenho
- Nome de exibição após concatenação de textos
- Resultados de negócio calculados com base em condições

## Configuração de criação

Na página 「Configure fields」 da tabela de dados, clique em 「Add field」 e selecione 「Fórmula」 para criar um campo de fórmula.

![20240512173541](https://static-docs.nocobase.com/20240512173541.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. A fórmula corresponde a `formula`, que determina como o campo será preenchido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como 「Subtotal do pedido」, 「Pontuação geral」 e 「Nome de exibição」. Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Os campos de fórmula usam `formula`; o tipo do resultado depende da configuração da fórmula. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. O foco está em verificar se a expressão da fórmula está completa e se os campos referenciados existem. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Depois de criado, o nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajustes de configuração posteriormente.

:::

## Características do campo

O comportamento padrão dos campos de fórmula é o seguinte:

| Característica | Descrição |
| --- | --- |
| Default Field interface | `formula`. |
| Default Field type | `formula`. |
| Field type opcional | `formula`. |
| Componente da página | No modo de edição, normalmente é configurada a expressão da fórmula; no modo de leitura, o resultado calculado é exibido. |
| Filtro | A possibilidade de filtrar depende do resultado da fórmula e do modo de execução. |
| Ordenação | A possibilidade de ordenar depende do resultado da fórmula e do modo de execução. |
| Validação | Depende da expressão da fórmula e do tipo do resultado. |

## Configuração de edição

Após a criação, clique em 「Edit」 à direita do campo para editar a configuração do campo de fórmula. A edição do campo é usada principalmente para ajustar sua forma de exibição e utilização no NocoBase, como modificar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela do banco de dados principal que já foi sincronizada, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Modifica o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser modificado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Os campos do banco de dados principal ou os campos sincronizados podem ser ajustados durante o mapeamento. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Os campos do banco de dados principal ou os campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes poderão ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afetará a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de utilização das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em 「Delete」 à direita do campo para excluir o campo de fórmula. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de fórmula criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados já existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por configurações de negócio.

:::

## Uso na configuração de páginas

Os campos de fórmula são adequados para exibir resultados calculados em tabelas, detalhes, estatísticas e fluxos de trabalho.
![20260710151619](https://static-docs.nocobase.com/20260710151619.png)

| Cenário | Uso |
| --- | --- |
| Configuração do campo | Escrever expressões de fórmula e selecionar os campos referenciados. |
| Bloco de tabela | Exibir resultados calculados. |
| Bloco de detalhes | Exibir o resultado calculado de um único registro. |
| Fluxo de trabalho | Ler o resultado da fórmula para participar de decisões posteriores. |

## Links relacionados

- [Campo](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Número](../data-modeling/collection-fields/basic/number.md) — Armazenar valores numéricos usados nos cálculos
- [JSON](../data-modeling/collection-fields/advanced/json.md) — Armazenar resultados estruturados