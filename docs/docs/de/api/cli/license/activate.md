---
title: "nb license activate"
description: "Referenz für den Befehl nb license activate: Kommerzielle Lizenzierung für eine ausgewählte env aktivieren."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Aktiviert die kommerzielle Lizenzierung für eine ausgewählte env. Sie können einen vorhandenen license key direkt angeben oder online eine Lizenz anfordern und aktivieren.

## Verwendung

```bash
nb license activate [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI-env; wenn weggelassen, wird die aktuelle env verwendet |
| `--key` | string | Vorhandenen license key direkt übergeben |
| `--key-file` | string | license key aus einer Datei lesen |
| `--online` | boolean | Lizenz online anfordern und aktivieren |
| `--account` | string | Konto des Lizenzdienstes für die Online-Aktivierung |
| `--password` | string | Passwort des Lizenzdienstes für die Online-Aktivierung |
| `--desc` | string | Anwendungsname für die Online-Aktivierung |
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --online
nb license activate --env app1 --online --account aa --password bb --desc test24
nb license activate --env app1 --online --account aa --password bb --desc test24 --yes
nb license activate --env app1 --json --key-file ./license.txt
```

## Hinweise

Bei der Online-Aktivierung fordert die CLI mit der Instanz-ID und der App-URL der aktuellen env einen license key beim Lizenzdienst an.

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

## Verwandte Befehle

- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
