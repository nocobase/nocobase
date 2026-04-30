---
title: "nb env auth"
description: "Referenz für den Befehl nb env auth: OAuth-Login für eine bereits gespeicherte NocoBase-env durchführen."
keywords: "nb env auth,NocoBase CLI,OAuth,Login,Authentifizierung"
---

# nb env auth

Führt einen OAuth-Login für die angegebene env durch. Wenn der Umgebungsname weggelassen wird, wird die aktuelle env verwendet.

## Verwendung

```bash
nb env auth [name]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `[name]` | string | Umgebungsname; bei Auslassung wird die aktuelle env verwendet |

## Beschreibung

Intern wird der PKCE-Ablauf verwendet: ein lokaler Callback-Dienst wird gestartet, der Browser zur Autorisierung geöffnet, das Token getauscht und in der Konfigurationsdatei gespeichert.

## Beispiele

```bash
nb env auth
nb env auth prod
```

## Verwandte Befehle

- [`nb env add`](./add.md)
- [`nb env update`](./update.md)
