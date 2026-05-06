---
title: "NocoBase CLI"
description: "NocoBase CLI (nb-Befehl) Referenz: Initialisierung, Konfiguration, Umgebungsverwaltung, Anwendungsbetrieb, Quellcode, Datenbank, Plugins, kommerzielle Lizenzierung, API, CLI-Selbstaktualisierung und Skills-Verwaltung."
keywords: "NocoBase CLI,nb,Kommandozeile,Befehlsreferenz,Konfiguration,Umgebungsverwaltung,Plugin-Verwaltung,kommerzielle Lizenzierung,API"
---

# NocoBase CLI

## Beschreibung

Die NocoBase CLI (`nb`) ist der Kommandozeilen-Einstiegspunkt von NocoBase und dient dazu, NocoBase-Anwendungen im lokalen Arbeitsbereich zu initialisieren, zu verbinden und zu verwalten.

Sie unterstützt zwei gängige Initialisierungspfade:

- Verbindung zu einer bestehenden NocoBase-Anwendung herstellen und als CLI env speichern
- Eine neue NocoBase-Anwendung über Docker, npm oder Git installieren und anschließend als CLI env speichern

Beim Erstellen einer neuen lokalen Anwendung kann [`nb init`](./init.md) auch NocoBase AI coding skills installieren oder aktualisieren. Wenn Sie diesen Schritt überspringen möchten, können Sie `--skip-skills` verwenden.

## Verwendung

```bash
nb [command]
```

Der Root-Befehl selbst dient hauptsächlich dazu, die Hilfe anzuzeigen und Aufrufe an Befehlsgruppen oder eigenständige Befehle weiterzuleiten.

## Befehlsgruppen (Topics)

In `nb --help` werden die folgenden Befehlsgruppen angezeigt:

| Befehlsgruppe | Beschreibung |
| --- | --- |
| [`nb api`](./api/index.md) | NocoBase-API über die CLI aufrufen. |
| [`nb app`](./app/index.md) | Laufzeitstatus der Anwendung verwalten: Starten, Stoppen, Neustarten, Logs und Upgrades. |
| [`nb config`](./config/index.md) | CLI-Standardkonfiguration verwalten. |
| [`nb db`](./db/index.md) | Eingebaute Datenbank der ausgewählten env verwalten. |
| [`nb env`](./env/index.md) | NocoBase-Projektumgebungen, Status, Details und Laufzeitbefehle verwalten. |
| [`nb license`](./license/index.md) | Kommerzielle Lizenzen und lizenzierte Plugins verwalten. |
| [`nb plugin`](./plugin/index.md) | Plugins der ausgewählten NocoBase env verwalten. |
| [`nb scaffold`](./scaffold/index.md) | Gerüst für die Entwicklung von NocoBase-Plugins erzeugen. |
| [`nb self`](./self/index.md) | NocoBase CLI selbst überprüfen oder aktualisieren. |
| [`nb skills`](./skills/index.md) | NocoBase AI coding skills im aktuellen Arbeitsbereich überprüfen oder synchronisieren. |
| [`nb source`](./source/index.md) | Lokale Quellcode-Projekte verwalten: Herunterladen, Entwicklung, Build und Tests. |

## Befehle (Commands)

Aktuell vom Root-Befehl direkt bereitgestellte eigenständige Befehle:

| Befehl | Beschreibung |
| --- | --- |
| [`nb init`](./init.md) | NocoBase initialisieren, damit der coding agent eine Verbindung herstellen und arbeiten kann. |

## Hilfe anzeigen

Hilfe für den Root-Befehl anzeigen:

```bash
nb --help
```

Hilfe für einen bestimmten Befehl oder eine Befehlsgruppe anzeigen:

```bash
nb init --help
nb app --help
nb config --help
nb api resource --help
nb license --help
```

## Beispiele

Interaktive Initialisierung:

```bash
nb init
```

Initialisierung über Browser-Formular:

```bash
nb init --ui
```

Eine Docker-Anwendung nicht-interaktiv erstellen:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Mit einer bestehenden Anwendung verbinden:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

Anwendung starten und Laufzeitbefehle aktualisieren:

```bash
nb app start -e app1
nb env update app1
```

API aufrufen:

```bash
nb api resource list --resource users -e app1
```

CLI-Standardkonfiguration anzeigen:

```bash
nb config list
nb config get docker.network
```

Status der kommerziellen Lizenz anzeigen:

```bash
nb license status -e app1
nb license plugins list -e app1
```

## Umgebungsvariablen

Die folgenden Umgebungsvariablen beeinflussen das Verhalten der CLI:

| Variable | Beschreibung |
| --- | --- |
| `NB_CLI_ROOT` | Wurzelverzeichnis, in dem die CLI die Konfiguration `.nocobase` und lokale Anwendungsdateien speichert. Standardmäßig das Home-Verzeichnis des aktuellen Benutzers. |
| `NB_LOCALE` | Sprache der CLI-Hinweise und der lokalen Initialisierungs-UI. Unterstützt werden `en-US` und `zh-CN`. |

Beispiel:

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## Konfigurationsdatei

Standard-Konfigurationsdatei:

```text
~/.nocobase/config.json
```

Nach dem Setzen von `NB_CLI_ROOT=/your/workspace` wird der Pfad der Konfigurationsdatei zu:

```text
/your/workspace/.nocobase/config.json
```

Die CLI ist auch kompatibel mit dem Lesen alter Projektkonfigurationen aus dem aktuellen Arbeitsverzeichnis.

Der Cache der Laufzeitbefehle wird gespeichert unter:

```text
.nocobase/versions/<hash>/commands.json
```

Diese Datei wird durch [`nb env update`](./env/update.md) erzeugt oder aktualisiert und dient als Cache für die aus der Zielanwendung synchronisierten Laufzeitbefehle.

## Verwandte Links

- [Schnellstart](../../ai/quick-start.mdx)
- [Installation, Upgrade und Migration](../../ai/install-upgrade-migration.mdx)
- [Globale Umgebungsvariablen](../app/env.md)
- [AI-Aufbau](../../ai-builder/index.md)
- [Plugin-Entwicklung](../../plugin-development/index.md)
