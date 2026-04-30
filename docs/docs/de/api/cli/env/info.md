---
title: "nb env info"
description: "nb env info Befehlsreferenz: Zeigt die Anwendungs-, Datenbank-, API- und Authentifizierungskonfiguration einer NocoBase CLI env an."
keywords: "nb env info,NocoBase CLI,Umgebungsdetails,Konfiguration"
---

# nb env info

Zeigt Detailinformationen einer einzelnen env an, einschließlich Anwendung, Datenbank, API und Authentifizierungskonfiguration.

## Verwendung

```bash
nb env info [name] [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `[name]` | string | Name der anzuzeigenden CLI env. Wird der Name weggelassen, wird die aktuelle env verwendet |
| `--env`, `-e` | string | Name der anzuzeigenden CLI env, alternativ zum Positionsparameter |
| `--json` | boolean | Ausgabe als JSON |
| `--show-secrets` | boolean | Token, Passwörter und andere Geheimnisse im Klartext anzeigen |

Wenn sowohl `[name]` als auch `--env` übergeben werden, müssen beide Werte übereinstimmen.

## Beispiele

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --show-secrets
nb env info --env app1
```

## Verwandte Befehle

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
