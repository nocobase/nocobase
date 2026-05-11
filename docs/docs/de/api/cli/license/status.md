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
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--doctor` | boolean | Zusätzliche Diagnoseprüfungen und Hinweise ausführen |
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb license status
nb license status --env app1
nb license status --env app1 --yes
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## Hinweise

Die neue CLI implementiert die Backend-Prüfung des Lizenzstatus derzeit noch nicht vollständig. Der Befehl kann grundlegenden Kontext und Diagnose-Platzhalter liefern, aber noch keine vollständige Lizenzbewertung.

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

## Verwandte Befehle

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
