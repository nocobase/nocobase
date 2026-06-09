---
title: "nb proxy nginx generate"
description: "Die Nginx-Konfiguration für ein CLI-verwaltetes Env erzeugen oder aktualisieren."
keywords: "nb proxy nginx generate,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx generate

Erzeugt oder aktualisiert die Nginx-Einstiegskonfiguration für ein CLI-verwaltetes Env.

## Verwendung

```bash
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name des CLI-verwalteten Env, für das die Konfiguration erzeugt werden soll |
| `--host` | string | Hostname, der in die Einstiegskonfiguration geschrieben wird, zum Beispiel `app1.example.com` |
| `--port` | string | Listen-Port, der in die Einstiegskonfiguration geschrieben wird, zum Beispiel `8080` |

## Erzeugte Dateien

Am Beispiel des Env `test2` pflegt der Befehl normalerweise diese Dateien und Verzeichnisse:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/nocobase.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`

Der erzeugte Einstieg deckt diese Hauptbereiche ab:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

## Beispiele

```bash
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx generate --env demo --host demo.local.nocobase.com --port 8080
```

## Hinweise

- `generate` schreibt oder aktualisiert nur die Konfiguration und startet Nginx nicht automatisch
- `app.conf` ist die bearbeitbare Einstiegsdatei, ihr verwalteter Block muss aber erhalten bleiben
- Wenn du Einstellungen wie `app-port` oder `app-public-path` mit `nb env update` änderst, musst du diesen Befehl in der Regel erneut ausführen
- Nur CLI-verwaltete Envs vom Typ `local` oder `docker` können diesen Befehl verwenden

## Verwandte Befehle

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx reload`](./reload.md)
- [`nb env update`](../../env/update.md)
