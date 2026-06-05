---
title: 'nb env proxy'
description: 'Referenz für den Befehl nb env proxy: Erzeugt eine Nginx- oder Caddy-Proxy-Konfiguration für ein verwaltetes CLI-env.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,Proxy-Konfiguration'
---

# nb env proxy

In der NocoBase CLI erzeugt `nb env proxy` eine Reverse-Proxy-Konfiguration für ein von der CLI verwaltetes env. Standardmäßig ist `nginx` die richtige Wahl. Wechseln Sie nur dann zu `caddy`, wenn Sie bereits Caddy einsetzen oder ausdrücklich eine Caddyfile benötigen.

Dieser Befehl funktioniert nur für verwaltete envs, deren Laufzeit von der aktuellen Maschine aus erreichbar ist, also für `local` oder `docker`. Envs mit nur einer entfernten API-Verbindung oder SSH-envs werden derzeit nicht unterstützt.

## Verwendung

```bash
nb env proxy [name] [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `[name]` | string | Name des konfigurierten env, für das eine Proxy-Konfiguration erzeugt werden soll. Ohne Angabe wird das aktuelle env verwendet |
| `--output`, `-o` | string | Ausgabepfad. Standard ist `~/.nocobase/proxy/<provider>/<env>/generated.<ext>` |
| `--provider` | string | Proxy-Provider: `nginx` oder `caddy` |
| `--host` | string | Hostname, der in die Einstiegskonfiguration geschrieben wird, zum Beispiel `example.com` oder `localhost` |
| `--port` | string | Port, der in die Einstiegskonfiguration geschrieben wird. Das ist der Proxy-Einstiegsport, nicht der Port der vorgelagerten NocoBase-App |
| `--install` | boolean | Installiert die gemeinsame Proxy-Konfiguration in die Hauptkonfiguration des Providers |
| `--reload` | boolean | Prüft und lädt den Provider nach dem Schreiben der Konfiguration neu |
| `--print` | boolean | Gibt die erzeugte Konfiguration auf stdout aus, statt Dateien zu schreiben |

## Standardausgabedateien

Wenn Sie `--output` nicht angeben, verwaltet die CLI unter `~/.nocobase/proxy/<provider>/` drei Arten von Dateien:

| Provider | Erzeugte Datei | Bearbeitbare Einstiegsdatei | Gemeinsame Hauptkonfiguration |
| --- | --- | --- | --- |
| `nginx` | `~/.nocobase/proxy/nginx/<env>/generated.conf` | `~/.nocobase/proxy/nginx/<env>/app.conf` | `~/.nocobase/proxy/nginx/nocobase.conf` |
| `caddy` | `~/.nocobase/proxy/caddy/<env>/generated.caddy` | `~/.nocobase/proxy/caddy/<env>/app.caddy` | `~/.nocobase/proxy/caddy/nocobase.caddy` |

Dabei gilt:

- `generated.*` wird von der CLI verwaltet und beim nächsten Ausführen von `nb env proxy` überschrieben
- `app.conf` / `app.caddy` ist die bearbeitbare Einstiegsdatei, aber der von der CLI verwaltete Verweis auf die generated-Konfiguration sollte erhalten bleiben
- `nocobase.conf` / `nocobase.caddy` ist die gemeinsame Hauptkonfiguration, die alle Einstiegsdateien der envs einbindet

Wenn Sie `--output` angeben, schreibt die CLI nur die erzeugte Konfiguration in diese Datei und erstellt oder aktualisiert weder die Einstiegsdatei noch die gemeinsame Hauptkonfiguration.

## Zugehörige Konfigurationseinträge

| Konfigurationseintrag | Standardwert | Beschreibung |
| --- | --- | --- |
| `proxy.provider` | `nginx` | Standard-Provider, den `nb env proxy` verwendet |
| `proxy.nb-cli-root` | CLI-Root, normalerweise das Home-Verzeichnis des aktuellen Benutzers | Ordnet den `.nocobase`-Pfad dem Wurzelpfad zu, den der Proxy-Prozess tatsächlich sieht |
| `proxy.upstream-host` | `127.0.0.1` | Host, zu dem der Proxy den Verkehr zurück zur NocoBase-App weiterleitet |
| `bin.caddy` | `caddy` | Pfad zur Caddy-Programmdatei, die bei `--install` oder `--reload` verwendet wird |
| `bin.nginx` | `nginx` | Pfad zur Nginx-Programmdatei, die bei `--install` oder `--reload` verwendet wird |

Die meisten Setups müssen `proxy.nb-cli-root` nicht ändern. In der Regel wird er nur gebraucht, wenn Nginx oder Caddy in einem anderen Container, unter einem anderen Mount-Root oder mit einer anderen Pfadsicht läuft.

## Hinweise

- `--port` muss eine Ganzzahl zwischen `1` und `65535` sein
- Der Port der vorgelagerten NocoBase-App kommt aus dem gespeicherten env `appPort`, nicht aus `--port`
- Wenn der Befehl meldet, dass für das env `appPort` fehlt, führen Sie zuerst `nb env update <name>` aus oder speichern Sie ihn explizit mit `nb env update <name> --app-port <port>`
- `--print` kann nicht mit `--install` oder `--reload` kombiniert werden
- `--output` kann nicht mit `--install` oder `--reload` kombiniert werden
- `--install` verbindet die gemeinsame Konfiguration mit der Hauptkonfiguration des Providers. `--reload` prüft und lädt den Provider neu. In der Praxis werden beide Flags meist zusammen verwendet

## Beispiele

```bash
# Erzeugt die Standard-nginx-Konfiguration für das aktuelle env
nb env proxy

# Erzeugt eine Konfiguration für ein bestimmtes env
nb env proxy demo

# Gibt die erzeugte Konfiguration aus, ohne Dateien zu schreiben
nb env proxy demo --print

# Schreibt Host und Port in die Einstiegskonfiguration
nb env proxy demo --host demo.local.nocobase.com --port 8080

# Erzeugt eine Caddy-Konfiguration
nb env proxy demo --provider caddy --host demo.local.nocobase.com

# Ändert den Standard-Provider und den Upstream-Host
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal

# Ordnet den .nocobase-Pfad zu, wenn der Provider unter einem anderen Root-Pfad läuft
nb config set proxy.nb-cli-root /workspace

# Installiert die gemeinsame Konfiguration in die Hauptkonfiguration des Providers und lädt ihn neu
nb env proxy demo --install --reload
```

## Verwandte Befehle

- [`nb env update`](./update.md)
- [`nb env info`](./info.md)
- [`nb config`](../config/index.md)
- [`nb app start`](../app/start.md)
