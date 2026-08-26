---
title: "nb source dev"
description: "nb source dev Befehlsreferenz: Startet den NocoBase Entwicklungsmodus in einer env mit npm- oder Git-Quelle."
keywords: "nb source dev,NocoBase CLI,Entwicklungsmodus,Hot-Reload"
---

# nb source dev

Startet den Entwicklungsmodus in einer env mit npm- oder Git-Quelle. Für Docker env verwenden Sie bitte [`nb app logs`](../app/logs.md), um die Laufzeitlogs anzusehen.

## Verwendung

```bash
nb source dev [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI env, in der der Entwicklungsmodus gestartet werden soll. Wird der Name weggelassen, wird die aktuelle env verwendet |
| `--db-sync` | boolean | Datenbank vor dem Start des Entwicklungsmodus synchronisieren |
| `--port`, `-p` | string | Port des Entwicklungsservers |
| `--client`, `-c` | boolean | Nur den Client starten |
| `--server`, `-s` | boolean | Nur den Server starten |
| `--inspect`, `-i` | string | Node.js Inspect-Debug-Port für den Server |

## Beispiele

```bash
nb source dev
nb source dev --env app1
nb source dev --env app1 --db-sync
nb source dev --env app1 --port 12000
nb source dev --env app1 --client
nb source dev --env app1 --server
nb source dev --env app1 --inspect 9229
```

## Verwandte Befehle

- [`nb source download`](./download.md)
- [`nb app start`](../app/start.md)
- [`nb app logs`](../app/logs.md)
