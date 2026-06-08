---
title: 'nb config'
description: 'Referenz für den Befehl nb config: Verwaltet die Standardkonfigurationseinträge der NocoBase CLI.'
keywords: 'nb config,NocoBase CLI,Konfiguration,Standardkonfiguration'
---

# nb config

Verwaltet die Standardkonfiguration der CLI. Derzeit werden folgende Konfigurationseinträge unterstützt:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.caddy`
- `bin.git`
- `bin.nginx`
- `bin.yarn`
- `proxy.provider`
- `proxy.nb-cli-root`
- `proxy.upstream-host`

## Häufig verwendete Konfigurationseinträge

| Konfigurationseintrag | Standardwert | Beschreibung |
| --- | --- | --- |
| `locale` | Wird nach den aktuellen Regeln der CLI aufgelöst | Überschreibt die von der CLI verwendete Sprache |
| `update.policy` | `prompt` | Aktualisierungsrichtlinie beim Start: `prompt`, `auto` oder `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Überschreibt die Download-URL für kommerzielle Erweiterungspakete |
| `docker.network` | `nocobase` | Standardnetzwerk für von der CLI verwaltete Docker-Anwendungen |
| `docker.container-prefix` | `nb` | Standardpräfix für von der CLI verwaltete Docker-Container |
| `bin.docker` | `docker` | Überschreibt den Pfad zur Docker-Programmdatei |
| `bin.caddy` | `caddy` | Überschreibt den Pfad zur Caddy-Programmdatei |
| `bin.git` | `git` | Überschreibt den Pfad zur Git-Programmdatei |
| `bin.nginx` | `nginx` | Überschreibt den Pfad zur Nginx-Programmdatei |
| `bin.yarn` | `yarn` | Überschreibt den Pfad zur Yarn-Programmdatei |
| `proxy.provider` | `nginx` | Standard-Proxy-Provider, den `nb env proxy` verwendet |
| `proxy.nb-cli-root` | CLI-Root, normalerweise das Home-Verzeichnis des aktuellen Benutzers | Ordnet den `.nocobase`-Pfad dem vom Proxy-Prozess sichtbaren Root-Pfad zu |
| `proxy.upstream-host` | `127.0.0.1` | Host, den der Proxy für die Rückleitung zur NocoBase-App verwendet |

## Verwendung

```bash
nb config <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb config get`](./get.md)       | Liest den wirksamen Wert eines Konfigurationseintrags            |
| [`nb config set`](./set.md)       | Setzt einen Konfigurationseintrag                                |
| [`nb config delete`](./delete.md) | Löscht einen explizit gesetzten Konfigurationseintrag            |
| [`nb config list`](./list.md)     | Listet die derzeit explizit gesetzten Konfigurationseinträge auf |

## Beispiele

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.provider
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Verwandte Befehle

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
