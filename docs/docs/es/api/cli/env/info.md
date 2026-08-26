---
title: 'nb env info'
description: 'Referencia del comando nb env info: consulta la configuración de la aplicación, base de datos, API y autenticación del env especificado de NocoBase CLI.'
keywords: 'nb env info,NocoBase CLI,detalles del entorno,configuración'
---

# nb env info

Consulta la información detallada de un solo env, incluida la configuración de la aplicación, base de datos, API y autenticación.

## Uso

```bash
nb env info [name] [flags]
```

## Parámetros

| Parámetro        | Tipo    | Descripción                                                                                        |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `[name]`         | string  | Nombre del entorno configurado que se va a consultar; si se omite, se usa el env actual            |
| `--json`         | boolean | Genera JSON                                                                                        |
| `--field`        | string  | Devuelve solo un campo usando una ruta con puntos, como `app.url`, `app.appPath` o `api.auth.type` |
| `--show-secrets` | boolean | Muestra en texto plano tokens, contraseñas y otros secretos                                        |

## Ejemplos

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --field app.appPath
nb env info app1 --show-secrets
```

## Comandos relacionados

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
