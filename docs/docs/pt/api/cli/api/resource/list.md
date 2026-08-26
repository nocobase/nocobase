---
title: "nb api resource list"
description: "Referência do comando nb api resource list: lista os registros do recurso NocoBase especificado."
keywords: "nb api resource list,NocoBase CLI,consulta,listagem,recurso"
---

# nb api resource list

Lista os registros do recurso especificado. Você pode usar `--filter`, `--fields`, `--sort`, `--page` e outros parâmetros para controlar a consulta.

## Uso

```bash
nb api resource list --resource <resource> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--resource` | string | Nome do recurso, obrigatório |
| `--data-source` | string | Key da fonte de dados, padrão `main` |
| `--source-id` | string | ID do registro de origem para recursos relacionados |
| `--filter` | string | Condição de filtro como objeto JSON |
| `--fields` | string[] | Campos para consulta; pode ser passado várias vezes ou como um array JSON |
| `--appends` | string[] | Campos relacionados a anexar; pode ser passado várias vezes ou como um array JSON |
| `--except` | string[] | Campos a excluir; pode ser passado várias vezes ou como um array JSON |
| `--sort` | string[] | Campos de ordenação, por exemplo `-createdAt`; pode ser passado várias vezes ou como um array JSON |
| `--page` | integer | Número da página |
| `--page-size` | integer | Itens por página |
| `--paginate` / `--no-paginate` | boolean | Define se haverá paginação |

Também aceita os parâmetros gerais de conexão de [`nb api resource`](./index.md).

## Exemplos

```bash
nb api resource list --resource users
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
nb api resource list --resource users --filter '{"status":"active"}' --sort=-createdAt
```

## Comandos relacionados

- [`nb api resource get`](./get.md)
- [`nb api resource query`](./query.md)
