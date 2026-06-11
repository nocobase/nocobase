---
title: "nb plugin disable"
description: "Referencia del comando nb plugin disable: deshabilita uno o varios plugins en el env de NocoBase seleccionado."
keywords: "nb plugin disable,NocoBase CLI,deshabilitar plugin"
---

# nb plugin disable

Deshabilita uno o varios plugins en el env seleccionado.

## Uso

```bash
nb plugin disable <packages...> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<packages...>` | string[] | Nombres de los paquetes de Plugin; obligatorio, admite varios |
| `--env`, `-e` | string | Nombre del env de CLI; si se omite, se utiliza el env actual |
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |

## Ejemplos

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
nb plugin disable -e local --yes @nocobase/plugin-sample
```

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

## Comandos relacionados

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
