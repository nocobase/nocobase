---
title: "nb self check"
description: "Referencia del comando nb self check: comprueba la versión de la NocoBase CLI instalada y el soporte de actualización automática."
keywords: "nb self check,NocoBase CLI,comprobación de versión"
---

# nb self check

Comprueba la instalación actual de NocoBase CLI, resuelve la última versión del channel seleccionado e informa de si admite la actualización automática.

## Uso

```bash
nb self check [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--channel` | string | Channel de publicación con el que comparar; valor por defecto `auto`; opciones: `auto`, `latest`, `beta`, `alpha` |
| `--json` | boolean | Genera la salida en JSON |

## Ejemplos

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Comandos relacionados

- [`nb self update`](./update.md)
