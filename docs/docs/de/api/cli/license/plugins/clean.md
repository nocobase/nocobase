---
title: "nb license plugins clean"
description: "Referenz für den Befehl nb license plugins clean: Heruntergeladene kommerzielle Plugins für eine ausgewählte env entfernen."
keywords: "nb license plugins clean,NocoBase CLI,commercial plugins"
---

# nb license plugins clean

Entfernt heruntergeladene kommerzielle Plugins der ausgewählten env, ohne die Lizenzaktivierung zu verändern.

## Verwendung

```bash
nb license plugins clean [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI-env; wenn weggelassen, wird die aktuelle env verwendet |
| `--dry-run` | boolean | Nur anzeigen, welche Plugins entfernt würden, ohne tatsächlich etwas zu löschen |
| `--verbose`, `-V` | boolean | Detaillierte Logs pro Plugin anzeigen |
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

## Verwandte Befehle

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
