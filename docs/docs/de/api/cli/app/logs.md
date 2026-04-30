---
title: "nb app logs"
description: "Referenz für den Befehl nb app logs: NocoBase-Anwendungs-Logs einer angegebenen env anzeigen."
keywords: "nb app logs,NocoBase CLI,Anwendungs-Logs,Docker logs,pm2 logs"
---

# nb app logs

Zeigt die Anwendungs-Logs an. Bei npm/Git-Installationen werden pm2-Logs gelesen, bei Docker-Installationen werden Docker-Container-Logs gelesen.

## Verwendung

```bash
nb app logs [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI env, deren Logs angezeigt werden sollen; bei Auslassung wird die aktuelle env verwendet |
| `--tail` | integer | Anzahl der zuletzt angezeigten Log-Zeilen vor dem Folgen, Standard `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Ob neuen Logs kontinuierlich gefolgt wird |

## Beispiele

```bash
nb app logs
nb app logs --env app1
nb app logs --env app1 --tail 200
nb app logs --env app1 --no-follow
```

## Verwandte Befehle

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb db logs`](../db/logs.md)
