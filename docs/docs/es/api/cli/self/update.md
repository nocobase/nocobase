---
title: "nb self update"
description: "Referencia del comando nb self update: actualiza la NocoBase CLI instalada globalmente con npm, pnpm o yarn."
keywords: "nb self update,NocoBase CLI,actualizar,actualización automática"
---

# nb self update

Actualiza la NocoBase CLI instalada cuando esta es gestionada por una instalación global estándar de npm, pnpm o yarn.

## Uso

```bash
nb self update [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--channel` | string | Channel de publicación al que actualizar; valor por defecto `auto`; opciones: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Omite la confirmación de la actualización |
| `--json` | boolean | Genera la salida en JSON |
| `--skills` | boolean | También actualiza las NocoBase AI coding skills instaladas globalmente |
| `--verbose` | boolean | Muestra la salida detallada de la actualización |

## Comportamiento de actualización

`nb self update` primero detecta el método de instalación actual en tiempo de ejecución. No usa el caché histórico `self-install-methods.json`.

Cuando hay una actualización disponible, el comando usa el mismo package manager que gestiona la instalación global actual de la CLI:

| Método de instalación | Comando de actualización |
| --- | --- |
| `npm-global` | `npm install -g @nocobase/cli@<channel>` |
| `pnpm-global` | `pnpm add -g @nocobase/cli@<channel>` |
| `yarn-global` | `yarn global add @nocobase/cli@<channel>` |

La confirmación interactiva tiene yes como valor predeterminado. Usa `--yes` para omitir el prompt en scripts.

## Ejemplos

```bash
nb self update
nb self update --yes
nb self update --skills
nb self update --channel alpha --json
```

## Comandos relacionados

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
