---
title: "nb env info"
description: "Referencia del comando nb env info: muestra la configuración de aplicación, base de datos, API y autenticación de un env específico de NocoBase CLI."
keywords: "nb env info,NocoBase CLI,detalles del entorno,configuración"
---

# nb env info

Muestra la información detallada de un env, incluyendo la configuración de la aplicación, la base de datos, la API y la autenticación.

## Uso

```bash
nb env info [name] [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `[name]` | string | Nombre del env de CLI a consultar; si se omite, se utiliza el env actual |
| `--env`, `-e` | string | Nombre del env de CLI a consultar; alternativa al parámetro posicional |
| `--json` | boolean | Genera la salida en JSON |
| `--show-secrets` | boolean | Muestra en texto plano los secretos como token, contraseñas, etc. |

Si se proporcionan a la vez `[name]` y `--env`, ambos deben coincidir.

## Ejemplos

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --show-secrets
nb env info --env app1
```

## Comandos relacionados

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
