---
title: "nb proxy nginx"
description: "Referenz zur Befehlsgruppe nb proxy nginx: Nginx-Provider-Driver, Konfigurationserzeugung und Laufzeitsteuerung verwalten."
keywords: "nb proxy nginx,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx

`nb proxy nginx` ist der Einstiegspunkt der Befehlsgruppe für den Nginx-Provider.

Wenn du Nginx bereits für Websites, Zertifikate, Caching oder Zugriffskontrolle verwendest, ist das normalerweise der richtige Startpunkt. Die Gruppe kümmert sich um zwei Dinge:

- auswählen, wie Nginx ausgeführt wird, also als `local` oder `docker`
- den Nginx-Einstiegspunkt für CLI-verwaltete Envs erzeugen, starten, neu laden und prüfen

## Verwendung

```bash
nb proxy nginx <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb proxy nginx use`](./use.md) | Den Nginx-Driver umschalten |
| [`nb proxy nginx current`](./current.md) | Den aktuellen Driver ausgeben |
| [`nb proxy nginx generate`](./generate.md) | Die Nginx-Konfiguration für ein Env erzeugen oder aktualisieren |
| [`nb proxy nginx start`](./start.md) | Den Nginx-Proxy starten |
| [`nb proxy nginx restart`](./restart.md) | Den Nginx-Proxy neu starten |
| [`nb proxy nginx reload`](./reload.md) | Die Nginx-Konfiguration neu laden |
| [`nb proxy nginx stop`](./stop.md) | Den Nginx-Proxy stoppen |
| [`nb proxy nginx status`](./status.md) | Den Laufzeitstatus von Nginx anzeigen |
| [`nb proxy nginx info`](./info.md) | Driver, Konfigurationspfade und Laufzeitinfos anzeigen |

## Hinweise

- Der aktuelle Driver wird in `proxy.nginx-driver` gespeichert
- Der Standard-Driver ist `local`
- Der lokale Driver verwendet die ausführbare Datei, auf die `bin.nginx` zeigt; der Standardwert ist `nginx`
- Der Docker-Driver verwendet `nginx:latest`
- Der Standardname des Docker-Containers ist `<docker.container-prefix>-nginx-proxy`
- Der Docker-Driver bindet das `NB_CLI_ROOT` des Hosts im Container unter `/apps` ein

## Typischer Ablauf

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app1.example.com
nb proxy nginx start
nb proxy nginx status
nb proxy nginx info
```

## Verwandte Befehle

- [`nb proxy`](../index.md)
- [`nb proxy caddy`](../caddy/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
