---
title: "nb license plugins sync"
description: "Referenz für den Befehl nb license plugins sync: Kommerzielle Plugins synchronisieren, die durch die aktuelle Lizenz für eine ausgewählte env erlaubt sind."
keywords: "nb license plugins sync,NocoBase CLI,commercial plugins"
---

# nb license plugins sync

Synchronisiert die kommerziellen Plugins, die durch die aktuelle Lizenz erlaubt sind.

## Verwendung

```bash
nb license plugins sync [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI-env; wenn weggelassen, wird die aktuelle env verwendet |
| `--dry-run` | boolean | Änderungen nur anzeigen, ohne Plugins zu installieren, zu aktualisieren oder zu entfernen |
| `--version` | string | Zu synchronisierende Registry-Version oder dist-tag; standardmäßig wird die aktuelle Workspace-Version verwendet |
| `--verbose`, `-V` | boolean | Detaillierte Logs pro Plugin anzeigen |
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --json
```

## Hinweise

Wenn `--version` nicht angegeben ist, erkennt die CLI die aktuelle App-Version automatisch und verwendet sie, um die passende Registry-Version der kommerziellen Plugins zu bestimmen.

## Verwandte Befehle

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
