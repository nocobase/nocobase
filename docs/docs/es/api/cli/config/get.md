---
title: 'nb config get'
description: 'Referencia del comando nb config get: lee el valor efectivo de un elemento de configuración de la CLI.'
keywords: 'nb config get,NocoBase CLI,leer configuración'
---

# nb config get

Lee el valor efectivo del elemento de configuración de la CLI especificado. Si no se ha establecido explícitamente, devuelve el valor predeterminado.

## Uso

```bash
nb config get <key>
```

## Parámetros

| Parámetro | Tipo   | Descripción                                                                                                                                        |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nombre del elemento de configuración: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` o `bin.yarn` |

## Ejemplos

```bash
nb config get locale
nb config get update.policy
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
