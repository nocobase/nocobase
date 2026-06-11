---
title: "nb scaffold plugin"
description: "nb scaffold plugin Befehlsreferenz: Erzeugt ein Gerüst für ein NocoBase Plugin."
keywords: "nb scaffold plugin,NocoBase CLI,Plugin-Gerüst"
---

# nb scaffold plugin

Erzeugt den Gerüstcode für ein NocoBase Plugin.

## Verwendung

```bash
nb scaffold plugin <pkg> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<pkg>` | string | Plugin-Paketname, erforderlich |
| `--force-recreate`, `-f` | boolean | Erzwingt das erneute Erstellen des Plugin-Gerüsts |

## Beispiele

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold plugin @nocobase-example/plugin-hello --force-recreate
```

## Verwandte Befehle

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
