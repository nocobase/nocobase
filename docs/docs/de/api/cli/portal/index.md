---
title: "nb portal"
description: "nb portal Befehlsreferenz: Portal-Workspaces konfigurieren, erstellen, entwickeln, Quellcode synchronisieren, deployen und löschen."
keywords: "nb portal,NocoBase CLI,Portal,workspace,source storage,deploy"
---

# nb portal

`nb portal` verwaltet Portal-Workspaces. Ein Portal kann eigenen Frontend-Quellcode, einen eigenen Einstiegspfad und eigene Deployment-Ausgaben haben; diese Befehlsgruppe verbindet den Portal-Datensatz in NocoBase mit lokalem Workspace und source storage.

Ein typischer Ablauf: lokalen Workspace erstellen, Entwicklungsmodus starten, Quellcode in source storage pushen und anschließend builden und deployen. Wenn du ein bestehendes Portal übernimmst, ziehe es zuerst lokal mit `pull`.

## Verwendung

```bash
nb portal <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb portal config`](./config.md) | Aktualisiert die Source-Konfiguration des lokalen Portal-Workspaces und synchronisiert sie nach Möglichkeit mit dem Remote-Portal-Datensatz |
| [`nb portal create`](./create.md) | Erstellt einen lokalen Portal-Workspace aus einem Template und erstellt oder aktualisiert den Portal-Datensatz |
| [`nb portal deploy`](./deploy.md) | Buildet und deployt den angegebenen Portal-Workspace |
| [`nb portal destroy`](./destroy.md) | Löscht den Portal-Datensatz und den lokalen Workspace |
| [`nb portal dev`](./dev.md) | Startet den Entwicklungsmodus für den angegebenen Portal-Workspace |
| [`nb portal info`](./info.md) | Zeigt Details zum angegebenen Portal-Datensatz und lokalen Workspace |
| [`nb portal list`](./list.md) | Listet Portal-Datensätze und den Synchronisierungsstatus lokaler Workspaces auf |
| [`nb portal pull`](./pull.md) | Zieht Portal-Quellcode aus dem source storage in den lokalen Workspace |
| [`nb portal push`](./push.md) | Pusht lokale Portal-Quellcodeänderungen in den source storage |

## Typischer Ablauf

Ein Portal namens `customer` erstellen:

```bash
nb portal create customer -e dev --yes
```

Den lokalen Entwicklungsmodus starten:

```bash
nb portal dev customer -e dev --yes
```

Lokalen Workspace und Remote-Datensatz prüfen:

```bash
nb portal info customer -e dev --yes
nb portal list -e dev --yes
```

Quellcode pushen und deployen:

```bash
nb portal push customer -e dev --yes --message "Update customer portal"
nb portal deploy customer -e dev --yes
```

Ein bestehendes Portal übernehmen:

```bash
nb portal list -e dev --yes
nb portal pull customer -e dev --yes
nb portal dev customer -e dev --yes
```

Source storage wechseln:

```bash
nb portal config customer -e dev --yes --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal push customer -e dev --yes --message "Move customer portal source to Git"
```

## source storage

Beim Erstellen eines Portals wählen Sie, wo der Quellcode verwaltet wird:

| Modus | Beschreibung |
| --- | --- |
| `nocobase` | Default mode. Source code is managed by NocoBase source storage. |
| `git` | Source code is stored in a Git repository, configured with `--git-repo`, `--git-branch`, and `--git-path`. |

For quick creation and development, the default `nocobase` storage is usually enough. Use `git` when the Portal source should be reviewed, versioned, or built through an existing team workflow.

Source configuration is written to `portal.config.json` in the local workspace. `create`, `pull`, and `config` maintain this file; `push` and `deploy` read it to sync source or deployment output.

## Env Types

`nb portal` currently supports `local`, `docker`, and `http` envs:

| Modus | Beschreibung |
| --- | --- |
| `local` | The workspace and app storage are on the current machine. With default `nocobase` storage, `pull`/`push` usually do not need extra sync. |
| `docker` | The workspace is shared with the app through a Docker volume. With default `nocobase` storage, `pull`/`push` usually do not need extra sync. |
| `http` | Source and deployment output are synced through APIs. `pull` downloads a source archive, and `push` uploads one. |

`ssh` envs do not support Portal management in the current version.

## Local Workspace Path

Portals are stored under the selected env storage:

```text
<storagePath>/portals/<app>/<portal>
```

The main app access path is usually:

```text
<appPublicPath>/x/<portal>/
```

A sub-app access path is usually:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

## Env Confirmation

Most `nb portal` subcommands support `--env` and `--yes`:

| Parameter | Beschreibung |
| --- | --- |
| `--env`, `-e` | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | Skip cross-env confirmation when an explicit `--env` targets a different env from the current env. |

In scripts or AI agent workflows, pass `--env` and `--yes` explicitly to avoid stopping at an interactive confirmation.

## Verwandte Befehle

- [`nb env`](../env/index.md)
- [`nb app`](../app/index.md)
- [`nb source`](../source/index.md)
