---
title: "nb env status"
description: "nb env status Befehlsreferenz: Zeigt den Status für die aktuelle env, eine env oder alle env an."
keywords: "nb env status,NocoBase CLI,Umgebungsstatus,API Base URL"
---

# nb env status

Zeigt den env-Status an. Standardmäßig wird die aktuelle env geprüft. Sie können auch eine bestimmte env prüfen oder mit `--all` alle env anzeigen.

Dieser Befehl gibt eine vereinfachte Statustabelle mit `Env`, `Status` und `API Base URL` aus.

## Verwendung


nb env status [name] [flags]

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `[name]` | string | Name der konfigurierten Umgebung, die angezeigt werden soll; wird bei Weglassen aus der aktuellen env übernommen und kann nicht zusammen mit `--all` verwendet werden |
| `--all` | boolean | Status aller konfigurierten envs anzeigen |
| `--json-output` | boolean | Ergebnis als JSON ausgeben |

`[name]` und `--all` können nicht zusammen verwendet werden.

## Status values

`Status` ist das Ergebnis der Prüfung der Ziel-env durch die CLI. Typische Werte sind:

- `ok`: die env ist erreichbar und authentifiziert
- `auth failed`: die API ist erreichbar, aber die Authentifizierung ist fehlgeschlagen
- `unreachable`: die Zieladresse konnte nicht erreicht werden
- `unconfigured`: die env-Konfiguration ist unvollständig
- `missing`: die verwaltete App für diese env existiert nicht mehr

## Beispiele


nb env status
nb env status app1
nb env status --all
nb env status --all --json-output

## Verwandte Befehle

- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
