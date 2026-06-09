---
title: "nb proxy caddy generate"
description: "Die Caddy-Konfiguration für ein CLI-verwaltetes Env erzeugen oder aktualisieren."
keywords: "nb proxy caddy generate,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy generate

Erzeugt oder aktualisiert die Caddy-Einstiegskonfiguration für ein CLI-verwaltetes Env.

## Verwendung

```bash
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name des CLI-verwalteten Env, für das die Konfiguration erzeugt werden soll |
| `--host` | string | Hostname, der in die Site-Adresse geschrieben wird, zum Beispiel `app1.example.com` |
| `--port` | string | Listen-Port, der in die Site-Adresse geschrieben wird, zum Beispiel `8080` |

## Erzeugte Dateien

Am Beispiel des Env `test2` pflegt der Befehl normalerweise diese Dateien und Verzeichnisse:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`

Im aktuellen Aufbau ist `app.caddy` bereits die vollständige Site-Konfiguration für ein Env und wird nicht mehr in eine separate Datei `generated.caddy` aufgeteilt.

## Beispiele

```bash
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy generate --env demo --host demo.local.nocobase.com --port 8080
```

## Hinweise

- `generate` schreibt oder aktualisiert nur die Konfiguration und startet Caddy nicht automatisch
- Ein erneutes Erzeugen überschreibt `app.caddy` vollständig
- Wenn du Einstellungen wie `app-port` oder `app-public-path` mit `nb env update` änderst, musst du diesen Befehl in der Regel erneut ausführen
- Nur CLI-verwaltete Envs vom Typ `local` oder `docker` können diesen Befehl verwenden

## Verwandte Befehle

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy reload`](./reload.md)
- [`nb env update`](../../env/update.md)
