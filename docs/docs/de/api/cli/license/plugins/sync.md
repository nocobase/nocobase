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
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--dry-run` | boolean | Änderungen nur anzeigen, ohne Plugins zu installieren, zu aktualisieren oder zu entfernen |
| `--version` | string | Zu synchronisierende Registry-Version oder dist-tag; standardmäßig wird die aktuelle Workspace-Version verwendet |
| `--verbose` | boolean | Detaillierte Logs pro Plugin anzeigen |
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --yes
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --json
```

## Hinweise

Wenn `--version` nicht angegeben ist, erkennt die CLI die aktuelle App-Version automatisch und verwendet sie, um die passende Registry-Version der kommerziellen Plugins zu bestimmen.

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

## Verwandte Befehle

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
