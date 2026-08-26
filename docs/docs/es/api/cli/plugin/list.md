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
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |

## Ejemplos

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local --yes
nb plugin list -e local-docker
```

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

## Comandos relacionados

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
