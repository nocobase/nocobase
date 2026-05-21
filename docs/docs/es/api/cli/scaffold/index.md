---
title: "nb scaffold"
description: "Referencia del comando nb scaffold: genera scaffolding de plugins de NocoBase y de scripts de migración."
keywords: "nb scaffold,NocoBase CLI,scaffolding,Plugin,migration"
---

# nb scaffold

Genera el scaffolding relacionado con el desarrollo de plugins de NocoBase.

## Uso

```bash
nb scaffold <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb scaffold plugin`](./plugin.md) | Genera el scaffolding de un Plugin de NocoBase |
| [`nb scaffold migration`](./migration.md) | Genera un script de migración para un Plugin |

## Ejemplos

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
```

## Comandos relacionados

- [`nb plugin`](../plugin/index.md)
- [Desarrollo de plugins](../../../plugin-development/index.md)
