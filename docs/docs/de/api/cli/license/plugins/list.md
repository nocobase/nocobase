---
title: "nb license plugins list"
description: "Referenz für den Befehl nb license plugins list: Kommerzielle Plugins anzeigen, die der aktuellen Lizenz für eine ausgewählte env zugeordnet sind."
keywords: "nb license plugins list,NocoBase CLI,commercial plugins"
---

# nb license plugins list

Zeigt die kommerziellen Plugins an, die dem gespeicherten license key der ausgewählten env zugeordnet sind.

## Verwendung

```bash
nb license plugins list [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI-env; wenn weggelassen, wird die aktuelle env verwendet |
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --yes
nb license plugins list --env app1 --json
```

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

## Verwandte Befehle

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
