---
title: "nb skills install"
description: "Referencia del comando nb skills install: instala globalmente las Skills de AI coding de NocoBase."
keywords: "nb skills install,NocoBase CLI,instalar Skills"
---

# nb skills install

Instala globalmente las Skills de AI coding de NocoBase. Si ya están instaladas, este comando no realiza la actualización.

## Uso

```bash
nb skills install [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Omite la confirmación de la instalación |
| `--json` | boolean | Genera la salida en JSON |
| `--verbose` | boolean | Muestra la salida detallada de la instalación |

## Ejemplos

```bash
nb skills install
nb skills install --yes
nb skills install --json
```

## Comandos relacionados

- [`nb skills check`](./check.md)
- [`nb skills update`](./update.md)
