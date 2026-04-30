---
title: "nb self update"
description: "Referencia del comando nb self update: actualiza la NocoBase CLI instalada globalmente con npm."
keywords: "nb self update,NocoBase CLI,actualizar,actualización automática"
---

# nb self update

Actualiza la NocoBase CLI instalada cuando esta es gestionada por una instalación global estándar de npm.

## Uso

```bash
nb self update [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--channel` | string | Channel de publicación al que actualizar; valor por defecto `auto`; opciones: `auto`, `latest`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Omite la confirmación de la actualización |
| `--json` | boolean | Genera la salida en JSON |
| `--verbose` | boolean | Muestra la salida detallada de la actualización |

## Ejemplos

```bash
nb self update
nb self update --yes
nb self update --channel alpha --json
```

## Comandos relacionados

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
