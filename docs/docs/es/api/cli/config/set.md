---
title: "nb config set"
description: "Referencia del comando nb config set: establecer un elemento de configuración de la CLI."
keywords: "nb config set,NocoBase CLI,establecer configuración"
---

# nb config set

Establece un elemento de configuración de la CLI. Consulta [`nb config`](./index.md) para ver las claves de configuración admitidas.

## Uso

```bash
nb config set <key> <value>
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<key>` | string | Nombre del elemento de configuración. Consulta [`nb config`](./index.md) para ver los valores admitidos |
| `<value>` | string | Valor de configuración; no puede estar vacío |

## Ejemplos

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.caddy /opt/homebrew/bin/caddy
nb config set bin.git /usr/bin/git
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.pnpm /usr/local/bin/pnpm
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set bin.yarn yarn
```

## Notas

`update.policy` admite `prompt`, `auto` y `off`, y el valor predeterminado es `prompt`.

## Comandos relacionados

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
