---
title: 'nb config get'
description: 'Referencia del comando nb config get: leer el valor efectivo de un elemento de configuración de la CLI.'
keywords: 'nb config get,NocoBase CLI,leer configuración'
---

# nb config get

Lee el valor efectivo del elemento de configuración indicado de la CLI. Si no se ha definido de forma explícita, se devuelve el valor predeterminado.

## Uso

```bash
nb config get <key>
```

## Parámetros

| Parámetro | Tipo   | Descripción                                                                                             |
| --------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nombre del elemento de configuración. Consulta [`nb config`](./index.md) para ver los valores admitidos |

## Ejemplos

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get nb-image-registry
nb config get nb-image-variant
nb config get proxy.nb-cli-root
nb config get proxy.upstream-host
nb config get bin.nginx
nb config get bin.git
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
