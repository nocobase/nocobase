---
title: "nb scaffold migration"
description: "nb scaffold migration Befehlsreferenz: Erzeugt ein Migrationsskript für ein NocoBase Plugin."
keywords: "nb scaffold migration,NocoBase CLI,Migrationsskript,migration"
---

# nb scaffold migration

Erzeugt eine Migrationsskript-Datei für ein Plugin.

## Verwendung

```bash
nb scaffold migration <name> --pkg <pkg> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<name>` | string | Name des Migrationsskripts, erforderlich |
| `--pkg` | string | Name des zugehörigen Plugin-Pakets, erforderlich |
| `--on` | string | Ausführungszeitpunkt: `beforeLoad`, `afterSync` oder `afterLoad` |

## Beispiele

```bash
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
nb scaffold migration migration-name --pkg @nocobase/plugin-acl --on afterLoad
```

## Verwandte Befehle

- [`nb scaffold plugin`](./plugin.md)
- [Plugin-Entwicklung](../../../plugin-development/index.md)
