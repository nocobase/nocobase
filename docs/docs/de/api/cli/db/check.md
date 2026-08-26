---
title: "nb db check"
description: "Referenz für den Befehl nb db check: Prüfen, ob eine Datenbank über die aktuelle env oder explizite Datenbank-Flags erreichbar ist."
keywords: "nb db check,NocoBase CLI,database connection"
---

# nb db check

Prüft, ob eine Datenbank erreichbar ist. Sie können die gespeicherten Datenbankeinstellungen einer env wiederverwenden oder explizite `--db-*`-Flags übergeben.

## Verwendung

```bash
nb db check [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Datenbankeinstellungen aus einer CLI-env lesen; wenn weggelassen, müssen alle erforderlichen `--db-*`-Flags angegeben werden |
| `--db-dialect` | string | Datenbank-Dialekt: `postgres`, `kingbase`, `mysql` oder `mariadb` |
| `--db-host` | string | Hostname oder IP-Adresse der Datenbank |
| `--db-port` | string | TCP-Port der Datenbank |
| `--db-database` | string | Name der Datenbank |
| `--db-user` | string | Benutzername der Datenbank |
| `--db-password` | string | Passwort der Datenbank |
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb db check --env app1
nb db check --env app1 --db-password new-secret --json
nb db check --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret
```

## Hinweise

Wenn die ausgewählte env eine vom CLI verwaltete eingebaute Datenbank verwendet, ermittelt die CLI vor der Prüfung die tatsächliche Verbindungsadresse.

## Verwandte Befehle

- [`nb db ps`](./ps.md)
- [`nb env info`](../env/info.md)
