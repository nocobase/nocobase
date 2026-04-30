---
title: "nb plugin list"
description: "Referencia del comando nb plugin list: lista los plugins del env de NocoBase seleccionado."
keywords: "nb plugin list,NocoBase CLI,lista de plugins"
---

# nb plugin list

Lista los plugins instalados en el env seleccionado.

## Uso

```bash
nb plugin list [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env de CLI; si se omite, se utiliza el env actual |

## Ejemplos

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local-docker
```

## Comandos relacionados

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
