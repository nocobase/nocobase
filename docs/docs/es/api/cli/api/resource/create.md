---
title: "nb api resource create"
description: "Referencia del comando nb api resource create: crea un registro en el recurso NocoBase indicado."
keywords: "nb api resource create,NocoBase CLI,crear registro,CRUD"
---

# nb api resource create

Crea un registro en el recurso indicado. El contenido del registro se proporciona como un objeto JSON mediante `--values`.

## Uso

```bash
nb api resource create --resource <resource> --values <json> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--resource` | string | Nombre del recurso; obligatorio |
| `--data-source` | string | Clave de la fuente de datos; por defecto `main` |
| `--source-id` | string | ID del registro origen para los recursos asociados |
| `--values` | string | Datos del registro a crear como objeto JSON; obligatorio |
| `--whitelist` | string[] | Campos permitidos para escritura; admite valores repetidos o un array JSON |
| `--blacklist` | string[] | Campos prohibidos para escritura; admite valores repetidos o un array JSON |

También admite los parámetros generales de conexión de [`nb api resource`](./index.md).

## Ejemplos

```bash
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource create --resource posts.comments --source-id 1 --values '{"content":"Hello"}'
```

## Comandos relacionados

- [`nb api resource update`](./update.md)
- [`nb api resource destroy`](./destroy.md)
