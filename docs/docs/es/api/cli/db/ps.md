---
title: "nb db ps"
description: "Referencia del comando nb db ps: consulta el estado de ejecución de la base de datos integrada de los env configurados."
keywords: "nb db ps,NocoBase CLI,estado de la base de datos"
---

# nb db ps

Consulta el estado de ejecución de la base de datos integrada sin iniciar ni detener ningún recurso. Si se omite `--env`, se muestra el estado de la base de datos de todos los env configurados.

## Uso

```bash
nb db ps [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI a consultar; si se omite, se muestran todos los env |

## Ejemplos

```bash
nb db ps
nb db ps --env app1
```

## Comandos relacionados

- [`nb db start`](./start.md)
- [`nb db stop`](./stop.md)
- [`nb env info`](../env/info.md)
