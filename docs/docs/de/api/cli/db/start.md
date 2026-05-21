---
title: "nb db start"
description: "Referenz für den Befehl nb db start: Container der eingebauten Datenbank einer angegebenen env starten."
keywords: "nb db start,NocoBase CLI,Datenbank starten,Docker"
---

# nb db start

Startet den Container der eingebauten Datenbank einer angegebenen env. Dieser Befehl ist nur für envs verfügbar, in denen die durch die CLI verwaltete eingebaute Datenbank aktiviert ist.

## Verwendung

```bash
nb db start [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI env, deren eingebaute Datenbank gestartet werden soll; bei Auslassung wird die aktuelle env verwendet |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden Docker-Befehle anzeigen |

## Beispiele

```bash
nb db start
nb db start --env app1
nb db start --env app1 --verbose
```

## Verwandte Befehle

- [`nb db stop`](./stop.md)
- [`nb db logs`](./logs.md)
- [`nb app start`](../app/start.md)
