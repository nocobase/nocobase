---
title: "nb license status"
description: "Referenz für den Befehl nb license status: Den Status der kommerziellen Lizenz für eine ausgewählte env anzeigen."
keywords: "nb license status,NocoBase CLI,license status"
---

# nb license status

Zeigt den Status der kommerziellen Lizenz für die ausgewählte env an.

## Verwendung

```bash
nb license status [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI-env; wenn weggelassen, wird die aktuelle env verwendet |
| `--doctor` | boolean | Zusätzliche Diagnoseprüfungen und Hinweise ausführen |
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb license status
nb license status --env app1
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## Hinweise

Die neue CLI implementiert die Backend-Prüfung des Lizenzstatus derzeit noch nicht vollständig. Der Befehl kann grundlegenden Kontext und Diagnose-Platzhalter liefern, aber noch keine vollständige Lizenzbewertung.

## Verwandte Befehle

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
