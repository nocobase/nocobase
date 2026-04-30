---
title: "nb env add"
description: "Referenz für den Befehl nb env add: NocoBase-API-Adresse und Authentifizierungsmethode speichern und als aktuelle env festlegen."
keywords: "nb env add,NocoBase CLI,Umgebung hinzufügen,API-Adresse,Authentifizierung"
---

# nb env add

Speichert einen benannten NocoBase-API-Endpunkt und schaltet die CLI auf diese env um. Wenn als Authentifizierungsmethode `oauth` gewählt wird, wird automatisch der Login-Ablauf von [`nb env auth`](./auth.md) gestartet.

## Verwendung

```bash
nb env add [name] [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `[name]` | string | Umgebungsname; wird in einem TTY zur Eingabe aufgefordert, wenn weggelassen, in nicht-TTY erforderlich |
| `--verbose` | boolean | Detaillierten Fortschritt beim Schreiben der Konfiguration anzeigen |
| `--locale` | string | Sprache der CLI-Hinweise: `en-US` oder `zh-CN` |
| `--api-base-url`, `-u` | string | NocoBase-API-Adresse mit `/api`-Präfix |
| `--auth-type`, `-a` | string | Authentifizierungsmethode: `token` oder `oauth` |
| `--access-token`, `-t` | string | API key oder access token für die `token`-Authentifizierung |

## Beispiele

```bash
nb env add
nb env add local
nb env add local --api-base-url http://localhost:13000/api --auth-type oauth
nb env add local --api-base-url http://localhost:13000/api --auth-type token --access-token <token>
```

## Verwandte Befehle

- [`nb env auth`](./auth.md)
- [`nb env update`](./update.md)
- [`nb env list`](./list.md)
