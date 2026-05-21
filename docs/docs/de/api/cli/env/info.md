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
| `[name]` | string | Name der konfigurierten Umgebung, die angezeigt werden soll; wird bei Weglassen aus der aktuellen env übernommen |
| `--json` | boolean | Ausgabe als JSON |
| `--show-secrets` | boolean | Token, Passwörter und andere Geheimnisse im Klartext anzeigen |

## Beispiele

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --show-secrets
```

## Verwandte Befehle

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
