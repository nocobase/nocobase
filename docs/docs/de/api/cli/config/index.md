---
title: "nb config"
description: "Referenz zu nb config: Standard-Konfigurationswerte der NocoBase CLI verwalten."
keywords: "nb config,NocoBase CLI,Konfiguration,Standardkonfiguration"
---

# nb config

Verwaltet die Standard-Konfigurationswerte der CLI. Die aktuell unterstützten Schlüssel lassen sich grob in diese Gruppen einteilen:

- CLI selbst: `locale`, `update.policy`, `license.pkg-url`
- Docker-Runtime: `docker.network`, `docker.container-prefix`
- Externe ausführbare Dateien: `bin.docker`, `bin.caddy`, `bin.git`, `bin.nginx`, `bin.yarn`
- Proxy-Erzeugung: `proxy.nb-cli-root`, `proxy.upstream-host`, `proxy.nginx-driver`, `proxy.caddy-driver`

Die meisten Projekte brauchen nur wenige dieser Schlüssel. In der Praxis werden am häufigsten diese verwendet:

- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.nginx` oder `bin.caddy`
- `proxy.nginx-driver` oder `proxy.caddy-driver`

## Häufige Konfigurationsschlüssel

| Schlüssel | Standardwert | Beschreibung |
| --- | --- | --- |
| `locale` | wird nach den aktuellen CLI-Regeln aufgelöst | Überschreibt die von der CLI verwendete Sprache |
| `update.policy` | `prompt` | Update-Richtlinie beim Start: `prompt`, `auto` oder `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Überschreibt die Download-URL für kommerzielle Erweiterungspakete |
| `docker.network` | `nocobase` | Standardnetzwerk für CLI-verwaltete Docker-Anwendungen |
| `docker.container-prefix` | `nb` | Standardpräfix für CLI-verwaltete Docker-Container |
| `bin.docker` | `docker` | Überschreibt den Pfad zur Docker-Binärdatei |
| `bin.caddy` | `caddy` | Überschreibt den Pfad zur Caddy-Binärdatei |
| `bin.git` | `git` | Überschreibt den Pfad zur Git-Binärdatei |
| `bin.nginx` | `nginx` | Überschreibt den Pfad zur Nginx-Binärdatei |
| `bin.yarn` | `yarn` | Überschreibt den Pfad zur Yarn-Binärdatei |
| `proxy.nb-cli-root` | CLI-Root, normalerweise das Home-Verzeichnis des aktuellen Benutzers | Ordnet den `.nocobase`-Pfad auf den Root-Pfad ab, den der Proxy-Prozess tatsächlich sieht |
| `proxy.upstream-host` | `127.0.0.1` | Überschreibt die Host-Adresse, die der Proxy für die Rückleitung zur NocoBase-Anwendung verwendet |
| `proxy.nginx-driver` | `local` | Standard-Driver für `nb proxy nginx` |
| `proxy.caddy-driver` | `local` | Standard-Driver für `nb proxy caddy` |

## Verwendung

```bash
nb config <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb config get`](./get.md) | Effektiven Wert eines Konfigurationsschlüssels lesen |
| [`nb config set`](./set.md) | Einen Konfigurationsschlüssel setzen |
| [`nb config delete`](./delete.md) | Einen explizit gesetzten Konfigurationsschlüssel löschen |
| [`nb config list`](./list.md) | Derzeit explizit gesetzte Konfigurationsschlüssel auflisten |

## Beispiele

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.nb-cli-root
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set proxy.nginx-driver docker
nb config set proxy.caddy-driver local
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Hinweise

- `bin.nginx` und `bin.caddy` wirken sich nur auf den `local`-Driver von `nb proxy nginx` und `nb proxy caddy` aus
- `proxy.nginx-driver` und `proxy.caddy-driver` speichern den Standard-Driver des jeweiligen Providers
- `proxy.nb-cli-root` und `proxy.upstream-host` sind erweiterte Proxy-Overrides. Für die meisten CLI-verwalteten `local`- oder `docker`-Envs reichen die Standardwerte aus
- Wenn du nur den aktiven Proxy-Driver umschalten möchtest, ist `nb proxy nginx use` oder `nb proxy caddy use` in der Regel klarer als das manuelle Setzen des Konfigurationsschlüssels

## Verwandte Befehle

- [`nb init`](../init.md)
- [`nb proxy`](../proxy/index.md)
- [`nb license`](../license/index.md)
