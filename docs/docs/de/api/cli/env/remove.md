---
title: 'nb env remove'
description: 'Referenz für den Befehl nb env remove: Stoppt verwaltete Laufzeitumgebungen, bevor die env-Konfiguration entfernt wird, oder bereinigt bei Bedarf lokal verwaltete Ressourcen vollständig.'
keywords: 'nb env remove,NocoBase CLI,Umgebung löschen,Konfiguration entfernen,purge'
---

# nb env remove

Entfernt eine konfigurierte env. Für local/docker-envs stoppt dieser Befehl zunächst die von der CLI verwaltete Anwendungs-Laufzeitumgebung und die integrierte Datenbank-Laufzeitumgebung auf dem aktuellen Rechner und entfernt dann die gespeicherte CLI-env-Konfiguration. Für http/ssh-envs entfernt dieser Befehl nur die gespeicherte CLI-env-Konfiguration.

Wenn die entfernte env die aktuelle env ist, wählt die CLI automatisch eine neue aktuelle env aus den verbleibenden envs aus; wenn keine envs mehr verfügbar sind, wird die aktuelle env geleert.

Standardmäßig verlangt der Befehl eine Bestätigung. Im nicht-interaktiven Modus muss `--force` ausdrücklich übergeben werden, damit der Befehl ausgeführt werden kann.

Um die von der CLI verwalteten Ressourcen auf dem aktuellen Rechner so weit wie möglich zu bereinigen, kann `--purge` übergeben werden. Für local/docker-envs bereinigt `--purge` zusätzlich verwaltete Laufzeitressourcen, storage-Daten und gegebenenfalls heruntergeladene lokale app-Dateien; für http/ssh-envs greift `--purge` keine externen Dienste an und entfernt nur die gespeicherte CLI-env-Konfiguration.

## Verwendung

```bash
nb env remove <name> [flags]
```

## Parameter

| Parameter       | Typ     | Beschreibung                                                                                                                                                                                                                          |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<name>`        | string  | Name der konfigurierten Umgebung, die entfernt werden soll                                                                                                                                                                            |
| `--force`, `-f` | boolean | Überspringt die Bestätigung im aktuellen remove-Modus; im nicht-interaktiven Modus erforderlich                                                                                                                                       |
| `--purge`       | boolean | Bereinigt zusätzlich die von der CLI verwalteten Ressourcen, storage-Daten und gegebenenfalls heruntergeladene lokale app-Dateien auf dem aktuellen Rechner; für Remote-API-envs wird nur die gespeicherte env-Konfiguration entfernt |
| `--verbose`     | boolean | Zeigt detaillierten Fortschritt an                                                                                                                                                                                                    |

## Beispiele

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Verwandte Befehle

- [`nb app stop`](../app/stop.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
