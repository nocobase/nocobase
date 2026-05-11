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
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--dry-run` | boolean | Nur anzeigen, welche Plugins entfernt würden, ohne tatsächlich etwas zu löschen |
| `--verbose` | boolean | Detaillierte Logs pro Plugin anzeigen |
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --yes
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

## Verwandte Befehle

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
