---
title: "nb proxy caddy"
description: "Referenz zur Befehlsgruppe nb proxy caddy: Caddy-Provider-Driver, Konfigurationserzeugung und Laufzeitsteuerung verwalten."
keywords: "nb proxy caddy,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy

`nb proxy caddy` ist der Einstiegspunkt der Befehlsgruppe für den Caddy-Provider.

Wenn du bereits eine Domain hast, HTTPS schnell aktivieren willst und möglichst wenig TLS-Details selbst pflegen möchtest, ist das normalerweise der richtige Startpunkt. Die Gruppe kümmert sich um zwei Dinge:

- auswählen, wie Caddy ausgeführt wird, also als `local` oder `docker`
- den Caddy-Einstiegspunkt für CLI-verwaltete Envs erzeugen, starten, neu laden und prüfen

## Verwendung

```bash
nb proxy caddy <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb proxy caddy use`](./use.md) | Den Caddy-Driver umschalten |
| [`nb proxy caddy current`](./current.md) | Den aktuellen Driver ausgeben |
| [`nb proxy caddy generate`](./generate.md) | Die Caddy-Konfiguration für ein Env erzeugen oder aktualisieren |
| [`nb proxy caddy start`](./start.md) | Den Caddy-Proxy starten |
| [`nb proxy caddy restart`](./restart.md) | Den Caddy-Proxy neu starten |
| [`nb proxy caddy reload`](./reload.md) | Die Caddy-Konfiguration neu laden |
| [`nb proxy caddy stop`](./stop.md) | Den Caddy-Proxy stoppen |
| [`nb proxy caddy status`](./status.md) | Den Laufzeitstatus von Caddy anzeigen |
| [`nb proxy caddy info`](./info.md) | Driver, Konfigurationspfade und Laufzeitinfos anzeigen |

## Hinweise

- Der aktuelle Driver wird in `proxy.caddy-driver` gespeichert
- Der Standard-Driver ist `local`
- Der lokale Driver verwendet die ausführbare Datei, auf die `bin.caddy` zeigt; der Standardwert ist `caddy`
- Der Docker-Driver verwendet `caddy:latest`
- Der Standardname des Docker-Containers ist `<docker.container-prefix>-caddy-proxy`
- Der Docker-Driver bindet das `NB_CLI_ROOT` des Hosts im Container unter `/apps` ein

## Typischer Ablauf

```bash
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app1.example.com
nb proxy caddy start
nb proxy caddy status
nb proxy caddy info
```

## Verwandte Befehle

- [`nb proxy`](../index.md)
- [`nb proxy nginx`](../nginx/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
