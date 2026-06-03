---
title: 'nb backup create'
description: 'Referenz für den Befehl nb backup create: Erstellt über die ausgewählte env ein Backup und lädt die Backup-Datei lokal herunter.'
keywords: 'nb backup create,NocoBase CLI,Backup erstellen,Backup herunterladen,nbdata'
---

# nb backup create

Erstellt über die ausgewählte env ein Backup und lädt die Backup-Datei lokal herunter. Wenn `--output` weggelassen wird, speichert die CLI die Datei im aktuellen Arbeitsverzeichnis und verwendet den vom Remote zurückgegebenen Backup-Dateinamen weiter — normalerweise `backup_*.nbdata`.

## Verwendung

```bash
nb backup create [flags]
```

## Parameter

| Parameter             | Typ     | Beschreibung                                                                                                                                                                                      |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e`         | string  | Name der CLI-env, für die das Backup erstellt werden soll; wenn weggelassen, wird die aktuelle env verwendet                                                                                      |
| `--yes`, `-y`         | boolean | Überspringt die interaktive Bestätigung, wenn die durch `--env` explizit angegebene env nicht mit der aktuellen env übereinstimmt                                                                 |
| `--output`, `-o`      | string  | Zielpfad für den Download. Wenn weggelassen, wird im aktuellen Verzeichnis gespeichert; zeigt der Pfad auf ein vorhandenes Verzeichnis, wird der entfernte Backup-Dateiname automatisch angehängt |
| `--json-output`, `-j` | boolean | Gibt das Endergebnis als JSON aus; enthaltene Felder sind `env`, `name` und `output`                                                                                                              |

## Beispiele

```bash
nb backup create
nb backup create --output ./backups
nb backup create --output ./backups/base.nbdata
nb backup create --env e2e --output ./backups --yes
nb backup create --env e2e --json-output
```

## Hinweise

Die CLI prüft nur dann, ob `--env` mit der aktuellen env übereinstimmt, wenn du `--env` explizit übergibst. Wenn explizit eine andere env angegeben wird, fragt ein interaktives Terminal zuerst nach einer Bestätigung; in einem nicht interaktiven Terminal oder in einem AI-agent-Szenario musst du selbst explizit `--yes` ergänzen oder zuerst `nb env use <name>` ausführen und es dann erneut versuchen.

Der Erstellungsablauf besteht aus zwei Schritten: Zuerst wird die Backup-API der Ziel-env aufgerufen, um ein Remote-Backup zu erstellen, anschließend wird der Status alle 2 Sekunden abgefragt; nach Abschluss des Backups wird die Datei lokal heruntergeladen. Wenn die Remote-Seite nach 600 Sekunden weiterhin `inProgress: true` zurückgibt, beendet sich der Befehl mit einem Timeout.

`--output` kann entweder ein Dateipfad oder ein vorhandener Verzeichnispfad sein. Die CLI erkennt nur einen bereits vorhandenen Pfad als Verzeichnis; existiert der Pfad nicht, wird er als Ziel-Dateipfad behandelt.

Nach Übergabe von `--json-output` gibt die CLI keinen Fortschrittstext mehr aus, sondern druckt direkt das endgültige JSON-Ergebnis. Dieser Modus eignet sich besser für die weitere Verarbeitung in Skripten und Agent-Workflows.

## Verwandte Befehle

- [`nb backup restore`](./restore.md)
- [`nb env update`](../env/update.md)
