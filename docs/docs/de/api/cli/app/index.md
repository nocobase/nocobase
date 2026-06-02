---
title: "nb app"
description: "Referenz für den Befehl nb app: Laufzeitstatus einer NocoBase-Anwendung verwalten, einschließlich Starten, Stoppen, Neustarten, Logs, Bereinigen und Aktualisieren."
keywords: "nb app,NocoBase CLI,Starten,Stoppen,Neustarten,Logs,Aktualisieren"
---

# nb app

Laufzeitstatus einer NocoBase-Anwendung verwalten. Bei npm/Git-envs werden die Anwendungsbefehle im lokalen Quellcode-Verzeichnis ausgeführt, bei Docker-envs werden die Anwendungs-Container anhand der gespeicherten env-Konfiguration verwaltet.

## Verwendung

```bash
nb app <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb app start`](./start.md) | Anwendung starten oder Docker-Container neu erstellen |
| [`nb app stop`](./stop.md) | Anwendung stoppen oder Docker-Container entfernen |
| [`nb app restart`](./restart.md) | Anwendung erst stoppen und dann starten |
| [`nb app logs`](./logs.md) | Anwendungs-Logs anzeigen |
| [`nb app down`](./down.md) | Lokale Laufzeitressourcen stoppen und bereinigen |
| [`nb app destroy`](./destroy.md) | Verwaltete Laufzeitressourcen, Storage-Daten und die gespeicherte env-Konfiguration entfernen |
| [`nb app upgrade`](./upgrade.md) | Anwendung stoppen, Quellcode oder Image ersetzen und erneut starten |

## Beispiele

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app down --env app1 --all --force
nb app destroy --env app1 --force
```

## Verwandte Befehle

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
