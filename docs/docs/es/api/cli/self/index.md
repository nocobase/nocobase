---
title: "nb self"
description: "Referencia del comando nb self: comprueba o actualiza la NocoBase CLI instalada."
keywords: "nb self,NocoBase CLI,actualización automática,comprobación de versión"
---

# nb self

Comprueba o actualiza la instalación actual de NocoBase CLI.

## Uso

```bash
nb self <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb self check`](./check.md) | Comprueba la versión actual de la CLI y el soporte de actualización automática |
| [`nb self update`](./update.md) | Actualiza la NocoBase CLI instalada globalmente con npm |

## Ejemplos

```bash
nb self check
nb self check --json
nb self update --yes
```

## Comandos relacionados

- [`nb skills`](../skills/index.md)
- [`nb app upgrade`](../app/upgrade.md)
