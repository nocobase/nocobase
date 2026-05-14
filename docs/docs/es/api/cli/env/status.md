---
title: "nb env status"
description: "Referencia del comando nb env status: muestra el estado del env actual, de un env o de todos los env."
keywords: "nb env status,NocoBase CLI,estado del entorno,API Base URL"
---

# nb env status

Muestra el estado del env. Por defecto inspecciona el env actual. También puedes inspeccionar un env específico, o usar `--all` para ver todos los env.

Este comando imprime una tabla simplificada con `Env`, `Status` y `API Base URL`.

## Uso


nb env status [name] [flags]

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `[name]` | string | Nombre del entorno configurado que se va a consultar; si se omite, se usa el env actual y no puede usarse con `--all` |
| `--all` | boolean | Mostrar el estado de todos los env configurados |
| `--json-output` | boolean | Mostrar el resultado como JSON |

`[name]` y `--all` no pueden usarse juntos.

## Status values

`Status` es el resultado devuelto después de que la CLI comprueba el env de destino. Los valores habituales incluyen:

- `ok`: el env es accesible y está autenticado
- `auth failed`: la API es accesible, pero falló la autenticación
- `unreachable`: no se pudo acceder a la dirección de destino
- `unconfigured`: la configuración del env está incompleta
- `missing`: la app administrada para ese env ya no existe

## Ejemplos


nb env status
nb env status app1
nb env status --all
nb env status --all --json-output

## Comandos relacionados

- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
