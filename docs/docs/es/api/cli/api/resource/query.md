---
title: "nb api resource query"
description: "Referencia del comando nb api resource query: ejecuta consultas agregadas sobre el recurso NocoBase indicado."
keywords: "nb api resource query,NocoBase CLI,consulta agregada,estadísticas"
---

# nb api resource query

Ejecuta consultas agregadas sobre el recurso indicado. `--measures`, `--dimensions` y `--orders` se proporcionan en formato de array JSON.

## Uso

```bash
nb api resource query --resource <resource> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--resource` | string | Nombre del recurso; obligatorio |
| `--data-source` | string | Clave de la fuente de datos; por defecto `main` |
| `--measures` | string | Definiciones de métricas como array JSON |
| `--dimensions` | string | Definiciones de dimensiones como array JSON |
| `--orders` | string | Definiciones de ordenación como array JSON |
| `--filter` | string | Condiciones de filtrado como objeto JSON |
| `--having` | string | Condiciones de filtrado posteriores a la agrupación, como objeto JSON |
| `--limit` | integer | Límite máximo de filas devueltas |
| `--offset` | integer | Número de filas a omitir |
| `--timezone` | string | Zona horaria utilizada para el formato de la consulta |

También admite los parámetros generales de conexión de [`nb api resource`](./index.md).

## Ejemplos

```bash
nb api resource query --resource orders --measures '[{"field":["id"],"aggregation":"count","alias":"count"}]'
nb api resource query --resource orders --dimensions '[{"field":["status"],"alias":"status"}]' --orders '[{"field":["createdAt"],"order":"desc"}]'
```

## Comandos relacionados

- [`nb api resource list`](./list.md)
- [`nb api comandos dinámicos`](../dynamic.md)
