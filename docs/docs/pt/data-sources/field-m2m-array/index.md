---
pkg: "@nocobase/plugin-field-m2m-array"
title: "Muitos para muitos (array)"
description: "Usa um campo de array para armazenar várias chaves exclusivas da tabela de destino, estabelecendo uma relação muitos para muitos, como artigo-tags, sem precisar de uma tabela intermediária."
keywords: "muitos para muitos array,M2M Array,associação por array,BelongsToMany,NocoBase"
---
# Muitos para muitos (array)

## Introdução

É possível usar um campo de array na tabela de dados para armazenar várias chaves exclusivas da tabela de destino e, assim, estabelecer uma relação muitos para muitos com ela. Por exemplo: existem duas entidades, artigos e tags. Um artigo pode estar associado a várias tags; na tabela de artigos, um campo de array armazena os IDs dos registros correspondentes na tabela de tags.

:::warning{title=Observação}

- Sempre que possível, use uma tabela intermediária para estabelecer uma relação padrão de [muitos para muitos](../data-modeling/collection-fields/associations/m2m/index.md) e evite usar esse tipo de relação.
- Para relações muitos para muitos estabelecidas com campos de array, atualmente somente o PostgreSQL permite filtrar os dados da tabela de origem usando campos da tabela de destino. Por exemplo: no caso acima, é possível usar outros campos da tabela de tags, como o título, para filtrar os artigos.
  :::

### Configuração do campo

![configuração do campo muitos para muitos (array)](https://static-docs.nocobase.com/202407051108180.png)

## Descrição dos parâmetros

### Tabela de origem

A tabela de origem, ou seja, a tabela onde o campo atual está localizado.

### Tabela de destino

A tabela à qual a associação será estabelecida.

### Chave estrangeira

O campo de array que armazena, na tabela de origem, a chave do destino Target key.

Correspondência entre os tipos de campo de array:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Chave do destino

O campo correspondente aos valores armazenados no campo de array da tabela de origem, que deve ser exclusivo.
