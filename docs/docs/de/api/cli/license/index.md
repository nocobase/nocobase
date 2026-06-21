---
title: "nb license"
description: "Referenz für den Befehl nb license: Kommerzielle Lizenzierung und lizenzierte Plugins von NocoBase verwalten."
keywords: "nb license,NocoBase CLI,commercial licensing"
---

# nb license

Verwalten Sie die kommerzielle Lizenzierung von NocoBase, einschließlich der Aktivierung mit einem vorhandenen license key, der Anzeige von Instance IDs, des Lizenzstatus und lizenzierter Plugins.

## Verwendung

```bash
nb license <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb license activate`](./activate.md) | Kommerzielle Lizenzierung der aktuellen env mit einem vorhandenen license key aktivieren |
| [`nb license id`](./id.md) | Instanz-ID der aktuellen env anzeigen oder erzeugen |
| [`nb license status`](./status.md) | Status der kommerziellen Lizenz der aktuellen env anzeigen |
| [`nb license plugins`](./plugins/index.md) | Kommerzielle Plugins verwalten, die durch die aktuelle Lizenz erlaubt sind |

## Beispiele

```bash
nb license id --env app1
nb license activate --env app1 --key-file ./license.txt
nb license status --env app1
nb license plugins list --env app1
nb license plugins sync --env app1
```

## Verwandte Befehle

- [`nb config`](../config/index.md)
- [`nb plugin`](../plugin/index.md)
- [`nb db check`](../db/check.md)
