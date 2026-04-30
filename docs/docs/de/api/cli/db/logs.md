---
title: "nb db logs"
description: "Referenz für den Befehl nb db logs: Logs des Containers der eingebauten Datenbank einer angegebenen env anzeigen."
keywords: "nb db logs,NocoBase CLI,Datenbank-Logs,Docker logs"
---

# nb db logs

Zeigt die Logs des Containers der eingebauten Datenbank einer angegebenen env an. Dieser Befehl ist nur für envs verfügbar, in denen die durch die CLI verwaltete eingebaute Datenbank aktiviert ist.

## Verwendung

```bash
nb db logs [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI env, deren Datenbank-Logs angezeigt werden sollen; bei Auslassung wird die aktuelle env verwendet |
| `--tail` | integer | Anzahl der zuletzt angezeigten Log-Zeilen vor dem Folgen, Standard `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Ob neuen Logs kontinuierlich gefolgt wird |

## Beispiele

```bash
nb db logs
nb db logs --env app1
nb db logs --env app1 --tail 200
nb db logs --env app1 --no-follow
```

## Verwandte Befehle

- [`nb db ps`](./ps.md)
- [`nb app logs`](../app/logs.md)
