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
| `--yes` | boolean | Bestätigen, dass die übermittelten Informationen korrekt sind |
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --online
nb license activate --env app1 --online --account aa --password bb --desc test24 --yes
nb license activate --env app1 --json --key-file ./license.txt
```

## Hinweise

Bei der Online-Aktivierung fordert die CLI mit der Instanz-ID und der App-URL der aktuellen env einen license key beim Lizenzdienst an.

## Verwandte Befehle

- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
