---
title: "nb config get"
description: "Referencia del comando nb config get: obtener el valor efectivo de una clave de configuración del CLI."
keywords: "nb config get,NocoBase CLI,configuration"
---

# nb config get

Obtiene el valor efectivo de una clave de configuración del CLI. Si no existe un valor configurado explícitamente, se devuelve el valor predeterminado.

## Uso

```bash
nb config get <key>
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<key>` | string | Clave de configuración: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` o `bin.yarn` |

## Ejemplos

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
