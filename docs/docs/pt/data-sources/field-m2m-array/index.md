---
pkg: "@nocobase/plugin-field-m2m-array"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Muitos-para-Muitos (Array)

## Introdução

Este recurso permite que você use campos de array em uma **coleção** de dados para armazenar múltiplas chaves únicas da tabela de destino, estabelecendo assim um relacionamento de muitos-para-muitos entre as duas tabelas. Por exemplo, considere as entidades Artigos e Tags. Um artigo pode ser vinculado a várias tags, e a tabela de artigos armazena os IDs dos registros correspondentes da tabela de tags em um campo de array.

:::warning{title=Atenção}

- Sempre que possível, é recomendado usar uma **coleção** de junção para estabelecer um relacionamento [muitos-para-muitos](../data-modeling/collection-fields/associations/m2m/index.md) padrão, em vez de depender deste método.
- Atualmente, apenas o PostgreSQL oferece suporte à filtragem de dados da **coleção** de origem usando campos da tabela de destino para relacionamentos muitos-para-muitos estabelecidos com campos de array. Por exemplo, no cenário acima, você pode filtrar artigos com base em outros campos da tabela de tags, como o título.
  :::

### Configuração do Campo

![Configuração do campo muitos-para-muitos (array)](https://static-docs.nocobase.com/202407051108180.png)

## Descrição dos Parâmetros

### Coleção de Origem

A **coleção** de origem, ou seja, a tabela onde o campo atual reside.

### Coleção de Destino

A **coleção** de destino com a qual o relacionamento é estabelecido.

### Chave Estrangeira

O campo de array na **coleção** de origem que armazena a `Target key` da tabela de destino.

As relações correspondentes para os tipos de campo de array são as seguintes:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Chave de Destino

O campo na **coleção** de destino que corresponde aos valores armazenados no campo de array da tabela de origem. Este campo deve ser único.