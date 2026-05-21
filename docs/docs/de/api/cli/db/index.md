---
title: "nb db"
description: "Referenz für den Befehl nb db: Laufzeitstatus der eingebauten Datenbank der ausgewählten env anzeigen oder verwalten."
keywords: "nb db,NocoBase CLI,Eingebaute Datenbank,Docker,Datenbankstatus"
---

# nb db

Zeigt die durch die CLI verwaltete eingebaute Datenbank an oder verwaltet sie. Für envs ohne durch die CLI verwalteten Datenbank-Container zeigt `nb db ps` zusätzlich Status wie `external` oder `remote` an.

## Verwendung

```bash
nb db <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb db check`](./check.md) | Prüfen, ob die Datenbankverbindung erreichbar ist. |
| [`nb db ps`](./ps.md) | Laufzeitstatus der eingebauten Datenbank anzeigen |
| [`nb db start`](./start.md) | Container der eingebauten Datenbank starten |
| [`nb db stop`](./stop.md) | Container der eingebauten Datenbank stoppen |
| [`nb db logs`](./logs.md) | Logs des Containers der eingebauten Datenbank anzeigen |

## Beispiele

```bash
nb db check --env app1
nb db check --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret
nb db ps
nb db ps --env app1
nb db start --env app1
nb db stop --env app1
nb db logs --env app1
```

## Verwandte Befehle

- [`nb env info`](../env/info.md)
- [`nb app logs`](../app/logs.md)
