---
title: "nb scaffold"
description: "nb scaffold Befehlsreferenz: Erzeugt Gerüste für NocoBase Plugins und Migrationsskripte."
keywords: "nb scaffold,NocoBase CLI,Gerüst,Plugin,migration"
---

# nb scaffold

Erzeugt Gerüste für die Entwicklung von NocoBase Plugins.

## Verwendung

```bash
nb scaffold <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb scaffold plugin`](./plugin.md) | Erzeugt ein Gerüst für ein NocoBase Plugin |
| [`nb scaffold migration`](./migration.md) | Erzeugt ein Migrationsskript für ein Plugin |

## Beispiele

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
```

## Verwandte Befehle

- [`nb plugin`](../plugin/index.md)
- [Plugin-Entwicklung](../../../plugin-development/index.md)
