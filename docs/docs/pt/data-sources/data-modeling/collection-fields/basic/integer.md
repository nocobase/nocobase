---
title: "Inteiro"
description: "O campo inteiro é usado para armazenar valores sem casas decimais, como quantidades, número de pessoas, contagens e dias."
keywords: "inteiro,integer,campo numérico,NocoBase"
---

# Inteiro

## Introdução

No NocoBase, **inteiro (Integer)** é usado para armazenar valores sem casas decimais.

Os campos inteiros são adequados para dados de negócio como quantidades, contagens, número de pessoas e números de ordem. Eles podem ser usados em filtros, ordenações, estatísticas, permissões e condições de fluxo de trabalho.

Se precisar armazenar casas decimais, valores monetários, pesos ou proporções, é mais adequado escolher [número](./number.md) ou [porcentagem](./percent.md).

## Cenários de uso

Os inteiros são adequados para estes cenários de negócio:

- Quantidade de produtos, quantidade em estoque e quantidade comprada
- Número de participantes, vagas restantes e contagem de ocorrências
- Dias de duração, dias de atraso e dias do prazo de pagamento
- Códigos inteiros de sistemas externos

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Inteiro» para criar um campo inteiro.

![20240512175723](https://static-docs.nocobase.com/20240512175723.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para inteiros, corresponde a `integer` e determina como os dados serão inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Quantidade», «Número de pessoas» ou «Dias de atraso». Recomenda-se usar um nome que os usuários de negócio compreendam diretamente. |
| Field name | Nome identificador do campo, usado em referências internas da API, campos de relação, permissões, fluxos de trabalho e outros recursos. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, os campos inteiros usam `integer`; para inteiros de maior alcance, é possível escolher `bigInt`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser inserido automaticamente. |
| Validation rules | Regras de validação. É possível limitar o valor mínimo, o valor máximo ou definir se o preenchimento é obrigatório. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Após a criação, o nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme o nome antes da criação para evitar custos de reconfiguração posteriores.

:::

## Características do campo

O comportamento padrão dos campos inteiros é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `integer`. |
| Field type padrão | `integer`. |
| Field type disponível | `integer`, `bigInt`. |
| Componente da página | No modo de edição, é usado um campo de entrada numérica. |
| Filtros | Oferece filtros numéricos como igual, diferente, maior que, menor que, intervalo, vazio e não vazio. |
| Ordenação | Permite ordenar em blocos de tabela. |
| Validação | Oferece validações numéricas de valor mínimo, valor máximo e preenchimento obrigatório. |

## Edição da configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo inteiro. A edição é usada principalmente para ajustar a forma como o campo é exibido e utilizado no NocoBase, por exemplo, alterando o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente envolve um mapeamento de campo — mapeando o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Isso afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, confirme se os dados existentes poderão ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão usado ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale simplesmente a alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de utilização das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Exclusão do campo

Clique em «Delete» à direita do campo para excluir o campo inteiro. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo inteiro criado no banco de dados principal, normalmente a coluna correspondente e os dados existentes nela também serão excluídos do banco de dados. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

Os campos inteiros são adequados para uso em tabelas, formulários, estatísticas e fluxos de trabalho.
![20260709224913](https://static-docs.nocobase.com/20260709224913.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Inserir quantidades, contagens, dias e outros valores sem casas decimais. |
| Bloco de tabela | Exibir, ordenar e filtrar inteiros. |
| Bloco de gráfico | Gerar estatísticas com base em campos como quantidade e contagem. |
| Fluxos de trabalho e permissões | Usar como campo de condição para avaliações, por exemplo, verificar se a quantidade é maior que 0. |

## Links relacionados

- [Campos](../index.md) — Saiba mais sobre a função, as categorias e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Número](./number.md) — Armazene valores como casas decimais, valores monetários e pesos
- [Porcentagem](./percent.md) — Armazene proporções ou taxas de conclusão