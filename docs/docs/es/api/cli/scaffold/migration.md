---
title: "nb scaffold migration"
description: "Referencia del comando nb scaffold migration: genera un script de migración para un Plugin de NocoBase."
keywords: "nb scaffold migration,NocoBase CLI,script de migración,migration"
---

# nb scaffold migration

Genera el archivo de un script de migración para un Plugin.

## Uso

```bash
nb scaffold migration <name> --pkg <pkg> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<name>` | string | Nombre del script de migración; obligatorio |
| `--pkg` | string | Nombre del paquete del Plugin al que pertenece; obligatorio |
| `--on` | string | Momento de ejecución: `beforeLoad`, `afterSync` o `afterLoad` |

## Ejemplos

```bash
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
nb scaffold migration migration-name --pkg @nocobase/plugin-acl --on afterLoad
```

## Comandos relacionados

- [`nb scaffold plugin`](./plugin.md)
- [Desarrollo de plugins](../../../plugin-development/index.md)
