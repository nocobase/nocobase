---
title: 'nb app'
description: 'Referenz für den Befehl nb app: Verwaltet die NocoBase-Anwendungslaufzeit, einschließlich Start, Stopp, Neustart, Protokollen und Upgrade.'
keywords: 'nb app,NocoBase CLI,starten,stoppen,neu starten,protokolle,upgrade'
---

# nb app

Verwaltet die NocoBase-Anwendungslaufzeit. In npm/Git env werden Anwendungsbefehle im lokalen Quellcodeverzeichnis ausgeführt; in Docker env werden Anwendung-Container basierend auf der gespeicherten Konfiguration verwaltet.

## Verwendung

```bash
nb app <command>
```

## Unterbefehle

| Befehl                           | Beschreibung                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| [`nb app start`](./start.md)     | Startet die Anwendung oder erstellt den Docker-Container neu                           |
| [`nb app stop`](./stop.md)       | Stoppt die Anwendung oder bereinigt den Docker-Container                               |
| [`nb app restart`](./restart.md) | Stoppt die Anwendung zuerst und startet sie dann                                       |
| [`nb app autostart`](./autostart/index.md) | Verwaltet Autostart-Markierungen und startet alle aktivierten Envs |
| [`nb app logs`](./logs.md)       | Zeigt die Anwendungsprotokolle an                                                      |
| [`nb app upgrade`](./upgrade.md) | Stoppt die Anwendung, ersetzt den Quellcode oder das Image und startet sie dann erneut |

## Beispiele

```bash
nb app start --env app1
nb app restart --env app1
nb app autostart enable --env app1 --yes
nb app autostart run
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app stop --env app1 --with-db
```

## Verwandte Befehle

- [`nb env info`](../env/info.md)
- [`nb env remove`](../env/remove.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
