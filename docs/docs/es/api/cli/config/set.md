---
title: 'nb config set'
description: 'Referencia del comando nb config set: establece un elemento de configuración de la CLI.'
keywords: 'nb config set,NocoBase CLI,establecer configuración'
---

# nb config set

Establece un elemento de configuración de la CLI. Los elementos de configuración compatibles actualmente son `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` y `bin.yarn`.

## Uso

```bash
nb config set <key> <value>
```

## Parámetros

| Parámetro | Tipo   | Descripción                                                                                                                                        |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nombre del elemento de configuración: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` o `bin.yarn` |
| `<value>` | string | Valor de configuración, no puede estar vacío                                                                                                       |

## Ejemplos

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Notas

`update.policy` admite `prompt`, `auto` y `off`, y el valor predeterminado es `prompt`.

## Comandos relacionados

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
