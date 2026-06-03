---
title: 'nb env info'
description: 'Referenz für den Befehl nb env info: Zeigt die App-, Datenbank-, API- und Authentifizierungskonfiguration der angegebenen NocoBase-CLI-Umgebung an.'
keywords: 'nb env info,NocoBase CLI,Umgebungsdetails,Konfiguration'
---

# nb env info

Zeigt detaillierte Informationen zu einer einzelnen env an, einschließlich App-, Datenbank-, API- und Authentifizierungskonfiguration.

## Verwendung

```bash
nb env info [name] [flags]
```

## Parameter

| Parameter        | Typ     | Beschreibung                                                                                                   |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `[name]`         | string  | Name der konfigurierten Umgebung, die angezeigt werden soll; wenn ausgelassen, wird die aktuelle env verwendet |
| `--json`         | boolean | JSON ausgeben                                                                                                  |
| `--field`        | string  | Gibt nur ein Feld über einen Punktpfad zurück, z. B. `app.url`, `app.appPath` oder `api.auth.type`             |
| `--show-secrets` | boolean | Zeigt Tokens, Passwörter und andere Geheimnisse im Klartext an                                                 |

## Beispiele

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --field app.appPath
nb env info app1 --show-secrets
```

## Verwandte Befehle

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
