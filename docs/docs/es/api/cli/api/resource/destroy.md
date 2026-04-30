---
title: "nb api resource destroy"
description: "Referencia del comando nb api resource destroy: elimina registros del recurso NocoBase indicado."
keywords: "nb api resource destroy,NocoBase CLI,eliminar registro,CRUD"
---

# nb api resource destroy

Elimina registros del recurso indicado. Puede utilizar `--filter-by-tk` o `--filter` para localizar los registros.

## Uso

```bash
nb api resource destroy --resource <resource> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--resource` | string | Nombre del recurso; obligatorio |
| `--data-source` | string | Clave de la fuente de datos; por defecto `main` |
| `--source-id` | string | ID del registro origen para los recursos asociados |
| `--filter-by-tk` | string | Valor de la clave primaria; para claves compuestas o múltiples puede pasar un array JSON |
| `--filter` | string | Condiciones de filtrado como objeto JSON |

También admite los parámetros generales de conexión de [`nb api resource`](./index.md).

## Ejemplos

```bash
nb api resource destroy --resource users --filter-by-tk 1
nb api resource destroy --resource posts --filter '{"status":"archived"}'
```

## Comandos relacionados

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
