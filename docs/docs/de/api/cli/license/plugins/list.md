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
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --json
```

## Verwandte Befehle

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
