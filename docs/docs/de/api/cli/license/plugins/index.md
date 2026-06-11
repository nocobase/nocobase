---
title: "nb license plugins"
description: "Referenz für den Befehl nb license plugins: Kommerzielle Plugins anzeigen oder synchronisieren, die durch die aktuelle Lizenz erlaubt sind."
keywords: "nb license plugins,NocoBase CLI,commercial plugins"
---

# nb license plugins

Zeigt kommerzielle Plugins an oder synchronisiert sie, die durch die aktuelle Lizenz erlaubt sind.

## Verwendung

```bash
nb license plugins <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb license plugins list`](./list.md) | Kommerzielle Plugins anzeigen, die der aktuellen Lizenz zugeordnet sind |
| [`nb license plugins sync`](./sync.md) | Kommerzielle Plugins synchronisieren, die durch die aktuelle Lizenz erlaubt sind |
| [`nb license plugins clean`](./clean.md) | Heruntergeladene kommerzielle Plugins der aktuellen env entfernen |

## Beispiele

```bash
nb license plugins list --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins clean --env app1 --verbose
```

## Verwandte Befehle

- [`nb license activate`](../activate.md)
- [`nb plugin list`](../../plugin/list.md)
