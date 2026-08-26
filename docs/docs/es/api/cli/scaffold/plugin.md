---
title: "nb scaffold plugin"
description: "Referencia del comando nb scaffold plugin: genera el scaffolding de un Plugin de NocoBase."
keywords: "nb scaffold plugin,NocoBase CLI,scaffolding de plugin"
---

# nb scaffold plugin

Genera el código de scaffolding de un Plugin de NocoBase.

## Uso

```bash
nb scaffold plugin <pkg> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<pkg>` | string | Nombre del paquete del Plugin; obligatorio |
| `--force-recreate`, `-f` | boolean | Fuerza la recreación del scaffolding del Plugin |

## Ejemplos

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold plugin @nocobase-example/plugin-hello --force-recreate
```

## Comandos relacionados

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
