---
title: 'NocoBase CLI'
description: 'NocoBase CLI (`nb`-Befehl) Referenz: Initialisierung, Backup und Wiederherstellung, Konfiguration, Umgebungsverwaltung, App-Laufzeit, Quellcode, Datenbank, Plugins, kommerzielle Lizenz, API, CLI-Selbstaktualisierung und Skills-Verwaltung.'
keywords: 'NocoBase CLI,nb,Kommandozeile,Befehlsreferenz,Backup,Wiederherstellung,Umgebungsverwaltung,Plugin-Verwaltung,kommerzielle Lizenz,API'
---

# NocoBase CLI

## Beschreibung

NocoBase CLI (`nb`) ist der Kommandozeilen-Einstiegspunkt von NocoBase und wird verwendet, um NocoBase-Anwendungen in einem lokalen Workspace zu initialisieren, zu verbinden und zu verwalten.

Es unterstützt zwei gängige Initialisierungspfade:

- Eine bestehende NocoBase-Anwendung verbinden und als CLI-env speichern
- Eine neue NocoBase-Anwendung über Docker, npm oder Git installieren und anschließend als CLI-env speichern

Beim Erstellen einer neuen lokalen Anwendung kann [`nb init`](./init.md) auch NocoBase AI coding skills installieren oder aktualisieren. Um diesen Schritt zu überspringen, verwenden Sie `--skip-skills`.

## Verwendung

```bash
nb [command]
```

Der Root-Befehl selbst dient hauptsächlich dazu, Hilfe anzuzeigen und Aufrufe an Befehlsgruppen oder eigenständige Befehle weiterzuleiten.

## Befehlsgruppen (Topics)

Die folgenden Befehlsgruppen werden in `nb --help` angezeigt:

| Befehlsgruppe                        | Beschreibung                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| [`nb api`](./api/index.md)           | Ruft NocoBase-APIs über die CLI auf.                                                                          |
| [`nb app`](./app/index.md)           | Verwaltet die Laufzeit der Anwendung: starten, stoppen, neu starten, Logs und Upgrade.                        |
| [`nb backup`](./backup/index.md)     | Erstellt Backups und lädt sie lokal herunter oder stellt eine lokale Backup-Datei in der Ziel-env wieder her. |
| [`nb config`](./config/index.md)     | Verwaltet die Standardkonfiguration der CLI.                                                                  |
| [`nb db`](./db/index.md)             | Verwaltet die integrierte Datenbank der ausgewählten env.                                                     |
| [`nb env`](./env/index.md)           | Verwaltet NocoBase-Projektumgebungen, die aktuelle env, Status, Details und Laufzeitbefehle.                  |
| [`nb license`](./license/index.md)   | Verwaltet kommerzielle Lizenzen und lizenzierte Plugins.                                                      |
| [`nb plugin`](./plugin/index.md)     | Verwaltet Plugins der ausgewählten NocoBase-env.                                                              |
| [`nb scaffold`](./scaffold/index.md) | Erzeugt Scaffolding für die NocoBase-Plugin-Entwicklung.                                                      |
| [`nb self`](./self/index.md)         | Prüft oder aktualisiert die NocoBase CLI selbst.                                                              |
| [`nb session`](./session/index.md)   | Konfiguriert `NB_SESSION_ID`, damit die current env pro Shell oder agent runtime isoliert wird.               |
| [`nb skills`](./skills/index.md)     | Prüft oder synchronisiert die NocoBase AI coding skills im aktuellen Workspace.                               |
| [`nb source`](./source/index.md)     | Verwaltet lokale Quellcodeprojekte: herunterladen, entwickeln, bauen und testen.                              |

## Befehle

Derzeit direkt vom Root-Befehl bereitgestellte eigenständige Befehle:

| Befehl                 | Beschreibung                                                                     |
| ---------------------- | -------------------------------------------------------------------------------- |
| [`nb init`](./init.md) | Initialisiert NocoBase, damit der coding agent sich verbinden und arbeiten kann. |

## Hilfe anzeigen

Hilfe für den Root-Befehl anzeigen:

```bash
nb --help
```

Hilfe für einen Befehl oder eine Befehlsgruppe anzeigen:

```bash
nb init --help
nb app --help
nb backup --help
nb config --help
nb api resource --help
nb license --help
```

## Beispiele

Interaktive Initialisierung:

```bash
nb init
```

Initialisierung mit einem Browser-Formular:

```bash
nb init --ui
```

Eine Docker-Anwendung nicht interaktiv erstellen:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Mit einer bestehenden Anwendung verbinden:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env status
```

Den env-Status nach dem Starten der Anwendung erneut synchronisieren:

```bash
nb app start -e app1
nb env update app1
```

API aufrufen:

```bash
nb api resource list --resource users -e app1
```

Standardkonfiguration der CLI anzeigen:

```bash
nb config list
nb config get docker.network
```

Status der kommerziellen Lizenz anzeigen:

```bash
nb license status -e app1
nb license plugins list -e app1
```

Ein Backup erstellen und herunterladen:

```bash
nb backup create -e app1 --output ./backups
```

Ein lokales Backup wiederherstellen:

```bash
nb backup restore -e app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Umgebungsvariablen

Die folgenden Umgebungsvariablen beeinflussen das Verhalten der CLI:

| Variable        | Beschreibung                                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NB_CLI_ROOT`   | Stammverzeichnis, in dem die CLI die `.nocobase`-Konfiguration und lokale Anwendungsdateien speichert. Standard ist das Home-Verzeichnis des aktuellen Benutzers. |
| `NB_LOCALE`     | Sprache der CLI-Hinweise und der lokalen Initialisierungs-UI. Unterstützt `en-US` und `zh-CN`.                                                                    |
| `NB_SESSION_ID` | Sitzungs-ID der aktuellen Shell oder agent runtime. Wenn gesetzt, werden `nb env use` und `nb env current` pro Sitzung isoliert.                                  |

Beispiel:

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## Konfigurationsdatei

Standardkonfigurationsdatei:

```text
~/.nocobase/config.json
```

Nach dem Setzen von `NB_CLI_ROOT=/your/workspace` lautet der Pfad der Konfigurationsdatei:

```text
/your/workspace/.nocobase/config.json
```

Die CLI ist auch mit dem Lesen der alten `project`-Konfiguration im aktuellen Arbeitsverzeichnis kompatibel.

Der sitzungsbezogene Cache der aktuellen env wird gespeichert unter:

```text
.nocobase/sessions/<NB_SESSION_ID>.json
```

Die global zuletzt verwendete env wird im Feld `lastEnv` in `config.json` gespeichert. Wenn kein `NB_SESSION_ID` vorhanden ist, greift die CLI auf diesen globalen Wert zurück.

Der Cache für Laufzeitbefehle wird gespeichert unter:

```text
.nocobase/versions/<hash>/commands.json
```

Diese Datei wird von [`nb env update`](./env/update.md) erzeugt oder aktualisiert und dient dazu, aus der Zielanwendung synchronisierte Laufzeitbefehle zwischenzuspeichern.

## Verwandte Links

- [Schnellstart](../../ai/quick-start.mdx)
- [Globale Umgebungsvariablen](../app/env.md)
- [AI Builder](../../ai-builder/index.md)
- [Plugin-Entwicklung](../../plugin-development/index.md)
