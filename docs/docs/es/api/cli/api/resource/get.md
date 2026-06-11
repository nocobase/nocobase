---
title: "nb api resource get"
description: "Referencia del comando nb api resource get: obtiene un único registro del recurso NocoBase indicado."
keywords: "nb api resource get,NocoBase CLI,obtener registro,clave primaria"
---

# nb api resource get

Obtiene un único registro del recurso indicado. Habitualmente se utiliza `--filter-by-tk` para indicar la clave primaria.

## Uso

```bash
nb api resource get --resource <resource> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--resource` | string | Nombre del recurso; obligatorio |
| `--data-source` | string | Clave de la fuente de datos; por defecto `main` |
| `--source-id` | string | ID del registro origen para los recursos asociados |
| `--filter-by-tk` | string | Valor de la clave primaria; para claves compuestas o múltiples puede pasar un array JSON |
| `--fields` | string[] | Campos a consultar; admite valores repetidos o un array JSON |
| `--appends` | string[] | Campos asociados a añadir; admite valores repetidos o un array JSON |
| `--except` | string[] | Campos a excluir; admite valores repetidos o un array JSON |

También admite los parámetros generales de conexión de [`nb api resource`](./index.md).

## Ejemplos

```bash
nb api resource get --resource users --filter-by-tk 1
nb api resource get --resource posts.comments --source-id 1 --filter-by-tk 2
```

## Comandos relacionados

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
