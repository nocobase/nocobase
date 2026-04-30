---
title: "nb db stop"
description: "Referenz für den Befehl nb db stop: Container der eingebauten Datenbank einer angegebenen env stoppen."
keywords: "nb db stop,NocoBase CLI,Datenbank stoppen,Docker"
---

# nb db stop

Stoppt den Container der eingebauten Datenbank einer angegebenen env. Dieser Befehl ist nur für envs verfügbar, in denen die durch die CLI verwaltete eingebaute Datenbank aktiviert ist.

## Verwendung

```bash
nb db stop [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI env, deren eingebaute Datenbank gestoppt werden soll; bei Auslassung wird die aktuelle env verwendet |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden Docker-Befehle anzeigen |

## Beispiele

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Verwandte Befehle

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
- [`nb app down`](../app/down.md)
