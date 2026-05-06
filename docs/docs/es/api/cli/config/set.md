---
title: "nb config set"
description: "Referencia del comando nb config set: establecer un valor de configuración del CLI."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Establece un valor de configuración del CLI. Las claves compatibles son `license.pkg-url`, `docker.network` y `docker.container-prefix`.

## Uso

```bash
nb config set <key> <value>
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<key>` | string | Clave de configuración: `license.pkg-url`, `docker.network` o `docker.container-prefix` |
| `<value>` | string | Valor de configuración; no puede estar vacío |

## Ejemplos

```bash
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
```

## Notas

Al establecer `license.pkg-url`, el CLI normaliza la URL para que termine con `/`.

## Comandos relacionados

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
