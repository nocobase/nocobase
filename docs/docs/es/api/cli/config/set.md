---
title: "nb config set"
description: "Referencia del comando nb config set: establecer un valor de configuración del CLI."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Establece un valor de configuración del CLI. Las claves compatibles son `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` y `bin.yarn`.

## Uso

```bash
nb config set <key> <value>
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<key>` | string | Clave de configuración: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` o `bin.yarn` |
| `<value>` | string | Valor de configuración; no puede estar vacío |

## Ejemplos

```bash
nb config set locale es-ES
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Notas

Al establecer `license.pkg-url`, el CLI normaliza la URL para que termine con `/`.

`update.policy` admite `prompt`, `auto` y `off`. El valor predeterminado es `prompt`.

## Comandos relacionados

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
