---
title: "nb skills update"
description: "Referencia del comando nb skills update: actualiza las Skills de AI coding globales de NocoBase."
keywords: "nb skills update,NocoBase CLI,actualizar Skills"
---

# nb skills update

Actualiza las Skills de AI coding de NocoBase instaladas globalmente. Este comando solo actualiza una instalación existente de `@nocobase/skills`.

## Uso

```bash
nb skills update [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Omite la confirmación de la actualización |
| `--json` | boolean | Genera la salida en JSON |
| `--verbose` | boolean | Muestra la salida detallada de la actualización |

## Ejemplos

```bash
nb skills update
nb skills update --yes
nb skills update --json
```

## Comandos relacionados

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
