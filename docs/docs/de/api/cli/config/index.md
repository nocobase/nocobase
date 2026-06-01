---
title: "nb config"
description: "Referenz für den Befehl nb config: Standardkonfigurationselemente der NocoBase CLI verwalten."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

CLI-Standardkonfiguration verwalten. Derzeit unterstützte Schlüssel:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Häufig verwendete Schlüssel

| Schlüssel | Standardwert | Beschreibung |
| --- | --- | --- |
| `locale` | aktuelle CLI-Locale-Auflösung | Überschreibt die von der CLI verwendete Sprache |
| `update.policy` | `prompt` | Update-Verhalten beim Start: `prompt`, `auto` oder `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Paket-Registry für kommerzielle Pakete |
| `docker.network` | `nocobase` | Standard-Docker-Netzwerk für Docker-Apps, die von der CLI verwaltet werden |
| `docker.container-prefix` | `nb` | Standard-Präfix für Container von Docker-Apps, die von der CLI verwaltet werden |
| `bin.docker` | `docker` | Überschreibt den Pfad zur Docker-Programmdatei |
| `bin.git` | `git` | Überschreibt den Pfad zur Git-Programmdatei |
| `bin.yarn` | `yarn` | Überschreibt den Pfad zur Yarn-Programmdatei |

## Verwendung

```bash
nb config <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb config get`](./get.md) | Effektiven Wert eines Konfigurationsschlüssels auslesen |
| [`nb config set`](./set.md) | Einen Konfigurationswert setzen |
| [`nb config delete`](./delete.md) | Einen explizit gesetzten Wert löschen |
| [`nb config list`](./list.md) | Explizit gesetzte Werte auflisten |

## Beispiele

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Verwandte Befehle

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
