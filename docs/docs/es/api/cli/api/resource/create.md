---
title: "nb api resource create"
description: "Referencia del comando nb api resource create: crea uno o varios registros en el recurso NocoBase indicado."
keywords: "nb api resource create,NocoBase CLI,crear registro,CRUD"
---

# nb api resource create

Crea registros en el recurso indicado. El contenido se proporciona como un objeto JSON mediante `--values`; con un array JSON de objetos se crean varios registros en una sola petición.

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
| `--values` | string | Datos de los registros a crear: un objeto JSON, o un array JSON de objetos para crear varios registros; obligatorio |
| `--whitelist` | string[] | Campos permitidos para escritura; admite valores repetidos o un array JSON |
| `--blacklist` | string[] | Campos prohibidos para escritura; admite valores repetidos o un array JSON |

También admite los parámetros generales de conexión de [`nb api resource`](./index.md).

## Ejemplos

```bash
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource create --resource users --values '[{"nickname":"Ada"},{"nickname":"Grace"}]'
nb api resource create --resource posts.comments --source-id 1 --values '{"content":"Hello"}'
```

## Comandos relacionados

- [`nb api resource update`](./update.md)
- [`nb api resource destroy`](./destroy.md)
