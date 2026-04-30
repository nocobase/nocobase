---
title: "nb api resource list"
description: "Referencia del comando nb api resource list: lista los registros del recurso NocoBase indicado."
keywords: "nb api resource list,NocoBase CLI,listar consulta,recurso"
---

# nb api resource list

Lista los registros del recurso indicado. Puede utilizar parámetros como `--filter`, `--fields`, `--sort`, `--page`, etc., para controlar la consulta.

## Uso

```bash
nb api resource list --resource <resource> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--resource` | string | Nombre del recurso; obligatorio |
| `--data-source` | string | Clave de la fuente de datos; por defecto `main` |
| `--source-id` | string | ID del registro origen para los recursos asociados |
| `--filter` | string | Condiciones de filtrado como objeto JSON |
| `--fields` | string[] | Campos a consultar; admite valores repetidos o un array JSON |
| `--appends` | string[] | Campos asociados a añadir; admite valores repetidos o un array JSON |
| `--except` | string[] | Campos a excluir; admite valores repetidos o un array JSON |
| `--sort` | string[] | Campos de ordenación, por ejemplo `-createdAt`; admite valores repetidos o un array JSON |
| `--page` | integer | Número de página |
| `--page-size` | integer | Número de registros por página |
| `--paginate` / `--no-paginate` | boolean | Si paginar |

También admite los parámetros generales de conexión de [`nb api resource`](./index.md).

## Ejemplos

```bash
nb api resource list --resource users
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
nb api resource list --resource users --filter '{"status":"active"}' --sort=-createdAt
```

## Comandos relacionados

- [`nb api resource get`](./get.md)
- [`nb api resource query`](./query.md)
