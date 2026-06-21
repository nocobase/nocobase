---
title: "nb db ps"
description: "Referenz für den Befehl nb db ps: Laufzeitstatus der eingebauten Datenbank konfigurierter envs anzeigen."
keywords: "nb db ps,NocoBase CLI,Datenbankstatus"
---

# nb db ps

Zeigt den Laufzeitstatus der eingebauten Datenbank an, ohne Ressourcen zu starten oder zu stoppen. Wenn `--env` weggelassen wird, wird der Datenbankstatus aller konfigurierten envs angezeigt.

## Verwendung

```bash
nb db ps [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der anzuzeigenden CLI env; bei Auslassung werden alle envs angezeigt |

## Beispiele

```bash
nb db ps
nb db ps --env app1
```

## Verwandte Befehle

- [`nb db start`](./start.md)
- [`nb db stop`](./stop.md)
- [`nb env info`](../env/info.md)
