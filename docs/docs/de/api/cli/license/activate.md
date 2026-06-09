---
title: "nb license activate"
description: "Referenz für den Befehl nb license activate: Einen vorhandenen kommerziellen NocoBase license key für eine ausgewählte env aktivieren."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Aktiviert einen vorhandenen kommerziellen license key für eine ausgewählte env. Du kannst ihn direkt übergeben, aus einer Datei lesen oder ihn in einem interaktiven Terminal einfügen.

## Verwendung

```bash
nb license activate [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI-env; wenn weggelassen, wird die aktuelle env verwendet |
| `--key` | string | Vorhandenen kommerziellen license key direkt übergeben |
| `--key-file` | string | Vorhandenen kommerziellen license key aus einer Datei lesen |
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb license activate
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --json --key-file ./license.txt
```

## Hinweise

Bei interaktiver Ausführung zeigt die CLI zuerst den aktuellen Hostname und die Instance ID an und fordert dich dann auf, den license key direkt einzufügen oder einen Pfad zu einer key-Datei einzugeben. Damit kannst du prüfen, ob die Lizenz an die richtige Instanz gebunden wird.

Nach einer erfolgreichen Aktivierung solltest du die App neu starten, damit Lizenzstatus und kommerzielle Plugins tatsächlich wirksam werden; vor dem Neustart synchronisiert die CLI automatisch die durch die aktuelle Lizenz erlaubten kommerziellen Plugins:

```bash
nb app restart
```

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

## Verwandte Befehle

- [`nb app restart`](../app/restart.md)
- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
