---
title: "Percentual"
description: "O campo percentual é usado para armazenar taxas de conclusão, taxas de desconto, taxas de conversão e outros dados proporcionais."
keywords: "percentual,percent,proporção,taxa de conclusão,NocoBase"
---

# Percentual

## Introdução

No NocoBase, **Percentual (Percent)** é usado para armazenar e exibir dados proporcionais.

O campo percentual é adequado para dados de negócios como taxa de conclusão, taxa de desconto, taxa de conversão e participação. Em essência, ele é um campo numérico, mas sua exibição e entrada na página são mais alinhadas ao significado de percentual.

Se forem apenas valores monetários, quantidades ou pontuações comuns, é mais adequado escolher [Número](./number.md).

## Cenários de aplicação

O campo percentual é adequado para estes cenários de negócios:

- Taxa de conclusão de projetos e progresso de tarefas
- Taxa de desconto, taxa de imposto e percentual de comissão
- Taxa de conversão, taxa de atingimento e participação
- Peso de pontuação e percentual de rateio

## Configuração da criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Percentual» para criar um campo percentual.

![20240512175847](https://static-docs.nocobase.com/20240512175847.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para percentuais, corresponde a `percent` e determina como os dados serão inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Taxa de conclusão», «Taxa de desconto» ou «Taxa de conversão». Recomenda-se usar um nome que os usuários de negócio compreendam diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em API, campos de relacionamento, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Campos percentuais normalmente usam `double`, mas também é possível escolher `decimal` de acordo com os requisitos de precisão. |
| Default value | Valor padrão. Ao criar um registro, se o usuário não preencher o campo, o valor padrão poderá ser inserido automaticamente. |
| Validation rules | Regras de validação. É possível limitar o valor mínimo, o valor máximo ou definir se o preenchimento é obrigatório. |
| Description | Descrição do campo. É adequado indicar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Após a criação, o nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme o nome antes da criação para evitar custos de ajustes posteriores.

:::

## Características do campo

O comportamento padrão do campo percentual é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `percent`. |
| Field type padrão | `double`. |
| Field type disponível | `float`, `double` e `decimal`. |
| Componente da página | O modo de edição usa um componente de entrada de percentual. |
| Filtragem | Oferece suporte à filtragem numérica, como maior que, menor que, intervalo, vazio e não vazio. |
| Ordenação | Oferece suporte à ordenação em blocos de tabela. |
| Validação | Oferece suporte à validação de intervalo numérico, preenchimento obrigatório etc. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo percentual. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, como modificar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapeando o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Modifica o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser modificado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao criar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo percentual. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo percentual criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados já existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo percentual é adequado para expressar proporções em formulários de negócio, painéis, gráficos e relatórios.
![20260709225150](https://static-docs.nocobase.com/20260709225150.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Inserir taxas de conclusão, taxas de desconto, taxas de imposto e outras proporções. |
| Bloco de tabela | Exibir, ordenar e filtrar dados proporcionais. |
| Bloco de gráfico | Exibir indicadores como participação e taxa de conversão. |
| Fluxos de trabalho e permissões | Participar de decisões como campo de condição, por exemplo, verificar se a taxa de conclusão atingiu 100%. |

## Links relacionados

- [Campos](../index.md) — Saiba mais sobre a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Número](./number.md) — Armazene valores numéricos comuns
- [Fórmula](../../../field-formula/index.md) — Calcule resultados proporcionais
