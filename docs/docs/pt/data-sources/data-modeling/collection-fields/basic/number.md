---
title: "Número"
description: "O campo de número é usado para armazenar valores numéricos, como valores monetários, pesos, avaliações e áreas, que podem conter casas decimais."
keywords: "número,number,double,decimal,NocoBase"
---

# Número

## Introdução

No NocoBase, **número (Number)** é usado para armazenar valores numéricos que podem conter casas decimais.

O campo de número é adequado para dados de negócio como valores monetários, pesos, áreas, avaliações e preços unitários. Ele pode ser usado em filtros, ordenações, estatísticas, fórmulas e condições de fluxos de trabalho.

Se o valor precisar ser um número inteiro, escolher [inteiro](./integer.md) é mais direto. Para exibir uma proporção ou porcentagem, escolha [porcentagem](./percent.md).

## Cenários de uso

O campo de número é adequado para estes cenários de negócio:

- Valores de pedidos, valores de contratos e preços unitários
- Peso, área, volume e distância
- Avaliações, coeficientes e valores antes do desconto
- Números decimais que precisam participar de estatísticas ou cálculos de fórmulas

## Configuração de criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Número» para criar um campo de número.

![20240512175752](https://static-docs.nocobase.com/20240512175752.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Número corresponde a `number` e determina como os dados são inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Valor do pedido», «Avaliação» ou «Peso». Recomenda-se usar um nome que os profissionais de negócio possam entender diretamente. |
| Field name | Nome de identificação do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo de número usa `double`; para cenários que exigem casas decimais precisas, como valores monetários, pode-se escolher `decimal`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. Permitem limitar o valor mínimo, o valor máximo, a precisão ou se o preenchimento é obrigatório. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a fonte dos dados ou o responsável pela manutenção. |

:::warning Atenção

Depois de criado, o nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme o nome antes da criação para evitar custos de ajustes de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de número é o seguinte:

| Característica | Descrição |
| --- | --- |
| Default Field interface | `number`. |
| Default Field type | `double`. |
| Field type opcional | `float`, `double`, `decimal`. |
| Componente da página | No modo de edição, utiliza um campo de entrada numérica. |
| Filtro | Oferece filtros numéricos como igual a, diferente de, maior que, menor que, intervalo, vazio e não vazio. |
| Ordenação | Permite ordenar em blocos de tabela. |
| Validação | Oferece validações como intervalo numérico e preenchimento obrigatório. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de número. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, como alterar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome de identificação do campo. |
| Field name | Não | O nome de identificação do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser utilizados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a fonte dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de utilização das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de número. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de número criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados já existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado de um banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de número é adequado para uso em entradas, estatísticas, gráficos e condições de fluxos de trabalho.
![20260709225103](https://static-docs.nocobase.com/20260709225103.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Inserir valores como quantias, avaliações e pesos. |
| Bloco de tabela | Exibir, ordenar e filtrar valores numéricos. |
| Bloco de gráfico | Agregar, somar ou calcular a média por campo numérico. |
| Campo de fórmula | Servir como campo de entrada para cálculos de fórmulas. |

## Links relacionados

- [Campo](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Inteiro](./integer.md) — Armazenar valores sem casas decimais
- [Porcentagem](./percent.md) — Armazenar proporções ou taxas de conclusão
- [Fórmula](../../../field-formula/index.md) — Calcular resultados com base em campos de número