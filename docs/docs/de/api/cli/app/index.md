---
title: "nb app"
description: "Referenz für den Befehl nb app: Laufzeitstatus einer NocoBase-Anwendung verwalten, einschließlich Starten, Stoppen, Neustarten, Logs, Bereinigen und Aktualisieren."
keywords: "nb app,NocoBase CLI,Starten,Stoppen,Neustarten,Logs,Aktualisieren"
---

# nb app

Laufzeitstatus einer NocoBase-Anwendung verwalten. Bei npm/Git-envs werden die Anwendungsbefehle im lokalen Quellcode-Verzeichnis ausgeführt, bei Docker-envs werden die gespeicherten Anwendungs-Container verwaltet.

## Verwendung

```bash
nb app <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb app start`](./start.md) | Anwendung oder Docker-Container starten |
| [`nb app stop`](./stop.md) | Anwendung oder Docker-Container stoppen |
| [`nb app restart`](./restart.md) | Anwendung erst stoppen und dann starten |
| [`nb app logs`](./logs.md) | Anwendungs-Logs anzeigen |
| [`nb app down`](./down.md) | Lokale Laufzeitressourcen stoppen und bereinigen |
| [`nb app upgrade`](./upgrade.md) | Quellcode oder Image aktualisieren und Anwendung neu starten |

## Beispiele

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 -s
nb app down --env app1 --all --yes
```

## Verwandte Befehle

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
