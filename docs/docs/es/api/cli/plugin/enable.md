---
title: "nb plugin enable"
description: "Referencia del comando nb plugin enable: habilita uno o varios plugins en el env de NocoBase seleccionado."
keywords: "nb plugin enable,NocoBase CLI,habilitar plugin"
---

# nb plugin enable

Habilita uno o varios plugins en el env seleccionado.

## Uso

```bash
nb plugin enable <packages...> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<packages...>` | string[] | Nombres de los paquetes de Plugin; obligatorio, admite varios |
| `--env`, `-e` | string | Nombre del env de CLI; si se omite, se utiliza el env actual |

## Ejemplos

```bash
nb plugin enable @nocobase/plugin-sample
nb plugin enable @nocobase/plugin-a @nocobase/plugin-b
nb plugin enable -e local @nocobase/plugin-sample
```

## Comandos relacionados

- [`nb plugin list`](./list.md)
- [`nb plugin disable`](./disable.md)
