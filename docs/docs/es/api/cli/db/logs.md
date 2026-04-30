---
title: "nb db logs"
description: "Referencia del comando nb db logs: consulta los registros del contenedor de la base de datos integrada del env indicado."
keywords: "nb db logs,NocoBase CLI,registros de base de datos,Docker logs"
---

# nb db logs

Consulta los registros del contenedor de la base de datos integrada del env indicado. Este comando solo es aplicable a los env con la base de datos integrada gestionada por el CLI habilitada.

## Uso

```bash
nb db logs [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI cuyos registros de base de datos integrada se consultan; si se omite, se utiliza el env actual |
| `--tail` | integer | Número de líneas recientes que se muestran antes de seguir los registros; por defecto `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Si seguir los nuevos registros de forma continua |

## Ejemplos

```bash
nb db logs
nb db logs --env app1
nb db logs --env app1 --tail 200
nb db logs --env app1 --no-follow
```

## Comandos relacionados

- [`nb db ps`](./ps.md)
- [`nb app logs`](../app/logs.md)
