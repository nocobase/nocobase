---
title: "nb env update"
description: "nb env update Befehlsreferenz: Aktualisiert das OpenAPI-Schema und den Cache der Laufzeitbefehle einer angegebenen env."
keywords: "nb env update,NocoBase CLI,OpenAPI,Laufzeitbefehle,swagger"
---

# nb env update

Aktualisiert das OpenAPI-Schema von der NocoBase-Anwendung und aktualisiert den lokalen Cache der Laufzeitbefehle. Der Cache wird unter `.nocobase/versions/<hash>/commands.json` abgelegt.

## Verwendung

```bash
nb env update [name] [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `[name]` | string | Name der Umgebung. Wird der Name weggelassen, wird die aktuelle env verwendet |
| `--verbose` | boolean | Ausführliche Fortschrittsanzeige |
| `--api-base-url` | string | Überschreibt die NocoBase API-Adresse und persistiert sie in der Ziel-env |
| `--role` | string | Rollenüberschreibung, wird als `X-Role`-Request-Header gesendet |
| `--token`, `-t` | string | Überschreibt den API-Schlüssel und persistiert ihn in der Ziel-env |

## Beispiele

```bash
nb env update
nb env update prod
nb env update prod --api-base-url http://localhost:13000/api
nb env update prod --token <token>
```

## Verwandte Befehle

- [`nb api`](../api/index.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
