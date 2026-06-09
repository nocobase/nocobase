---
title: "nb proxy"
description: "Referenz zur Befehlsgruppe nb proxy: Nginx- oder Caddy-Provider auswählen und Reverse-Proxy-Einstiegspunkte für CLI-verwaltete Envs verwalten."
keywords: "nb proxy,NocoBase CLI,nginx,caddy,reverse proxy,Proxy-Konfiguration"
---

# nb proxy

In der NocoBase CLI ist `nb proxy` der einheitliche Einstiegspunkt für die Verwaltung von Reverse Proxies.

Die CLI trennt dabei Env-Verwaltung und Entry-Layer-Verwaltung:

- `nb env` speichert und verwaltet Anwendungs-Envs
- `nb proxy` erzeugt und verwaltet Nginx- oder Caddy-Einstiegspunkte für diese von der CLI verwalteten Envs

Solange deine Anwendung bereits als CLI-verwaltetes Env gespeichert wurde und dieses Env `local` oder `docker` ist, reicht es normalerweise aus, direkt einen Provider-Unterbefehl zu verwenden.

## Verwendung

```bash
nb proxy <provider> <command>
```

## Befehlsübersicht

```bash
nb proxy nginx use <local|docker>
nb proxy nginx current
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
nb proxy nginx start
nb proxy nginx restart
nb proxy nginx reload
nb proxy nginx stop
nb proxy nginx status
nb proxy nginx info

nb proxy caddy use <local|docker>
nb proxy caddy current
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
nb proxy caddy start
nb proxy caddy restart
nb proxy caddy reload
nb proxy caddy stop
nb proxy caddy status
nb proxy caddy info
```

## Provider

| Ich möchte... | Hier weiterlesen |
| --- | --- |
| Nginx weiter für Websites, Zertifikate, Caching oder Zugriffskontrolle verwenden | [`nb proxy nginx`](./nginx/index.md) |
| HTTPS schnell verfügbar machen und weniger TLS-Details selbst pflegen | [`nb proxy caddy`](./caddy/index.md) |
| Env-Einstellungen anpassen, die das Proxy-Ergebnis beeinflussen können, etwa `app-port` oder `app-public-path` | [`nb env update`](../env/update.md) |

## Hinweise

- `nb proxy` selbst hat keine eigenständigen Flags
- Verwende `nb proxy nginx` oder `nb proxy caddy`, um Einstiegspunkte zu erzeugen und zu verwalten
- Beide Provider funktionieren nur für verwaltete Envs, deren Runtime vom aktuellen Rechner aus erreichbar ist, also `local` oder `docker`
- Beide Provider unterstützen zwei Driver: `local` und `docker`
- `use` speichert den Standard-Driver, und `current` gibt den aktuellen Driver direkt aus
- `generate` schreibt oder aktualisiert Einstiegskonfigurationsdateien und startet den Proxy-Prozess nicht automatisch
- `start`, `restart`, `reload`, `stop`, `status` und `info` arbeiten alle auf der Runtime des aktuellen Drivers
- Wenn du mit `nb env update` Einstellungen wie `app-port` oder `app-public-path` änderst, musst du den passenden `generate`-Befehl danach in der Regel erneut ausführen
- Diese Befehlsgruppe funktioniert derzeit nicht für Envs, die nur eine entfernte API-Verbindung haben, oder für SSH-Envs

## Typischer Ablauf

```bash
# 1. Provider und Runtime-Driver auswählen
nb proxy nginx use docker

# 2. Einstiegskonfiguration für ein CLI-verwaltetes Env erzeugen
nb proxy nginx generate --env app1 --host app1.example.com

# 3. Proxy starten
nb proxy nginx start

# 4. Status- und Pfadinformationen prüfen
nb proxy nginx status
nb proxy nginx info

# 5. Nach Konfigurationsänderungen neu laden
nb proxy nginx reload
```

Wenn du Caddy verwendest, ersetze in den obigen Befehlen `nginx` einfach durch `caddy`.

## Unterschiede zwischen den Befehlen

| Befehl | Zweck |
| --- | --- |
| `use` | Standard-Driver des aktuellen Providers umschalten |
| `current` | Aktuellen Provider-Driver ausgeben, etwa `local` oder `docker` |
| `generate` | Proxy-Einstiegsdateien für ein Env erzeugen oder aktualisieren |
| `start` | Proxy mit dem aktuellen Driver starten |
| `reload` | Konfiguration neu laden, ohne den Dienst zu stoppen |
| `restart` | Erst stoppen und dann erneut starten |
| `stop` | Proxy stoppen |
| `status` | Laufzeitstatus anzeigen |
| `info` | Driver, Config-File-Pfad, Runtime-Root, Upstream-Host und weitere Laufzeitdetails anzeigen |

## Beispiele

```bash
# Nginx für ein Env erzeugen und starten
nb proxy nginx use docker
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx start

# Caddy für ein Env erzeugen und starten
nb proxy caddy use local
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy start
```

## Verwandte Befehle

- [`nb proxy nginx`](./nginx/index.md)
- [`nb proxy caddy`](./caddy/index.md)
- [`nb env update`](../env/update.md)
- [`nb env info`](../env/info.md)
- [`nb config`](../config/index.md)
