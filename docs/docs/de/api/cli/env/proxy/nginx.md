---
title: 'nb env proxy nginx'
description: 'Referenz zur Befehlsgruppe nb env proxy nginx: Erzeugt Nginx-Proxy-Konfigurationen und Hilfsdateien für ein von der CLI verwaltetes env.'
keywords: 'nb env proxy nginx,NocoBase CLI,nginx,reverse proxy,Proxy-Konfiguration'
---

# nb env proxy nginx

`nb env proxy nginx` erzeugt Nginx-Proxy-Konfigurationen und Hilfsdateien für ein von der CLI verwaltetes env. Der Befehl passt gut, wenn du Nginx bereits für Sites nutzt oder Zertifikate, Caching und Zugriffskontrolle weiter selbst verwalten möchtest.

Dieser Befehl funktioniert nur für verwaltete envs, deren Runtime von der aktuellen Maschine aus erreichbar ist, also `local` oder `docker`. Für envs mit ausschließlich entfernter API-Verbindung oder für SSH-envs wird er derzeit nicht unterstützt.

## Verwendung

```bash
nb env proxy nginx [name] [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `[name]` | string | Name des konfigurierten env, für das eine Proxy-Konfiguration erzeugt werden soll. Ohne Angabe wird das aktuelle env verwendet |
| `--env`, `-e` | string | Env-Namen explizit angeben. Diese Form ist meist die bessere Wahl |
| `--host` | string | Hostname, der in die Einstiegskonfiguration geschrieben wird, etwa `example.com` oder `localhost` |
| `--port` | string | Port, der in die Einstiegskonfiguration geschrieben wird. Das ist der Eingangsport des Proxys, nicht der Upstream-Port der NocoBase-App |
| `--install` | boolean | Installiert die gemeinsame Proxy-Konfiguration in die Nginx-Hauptkonfiguration |
| `--reload` | boolean | Prüft und lädt Nginx neu, nachdem Dateien geschrieben wurden |
| `--print` | boolean | Gibt die gerenderte `app.conf` direkt aus, statt Dateien zu schreiben |

## Standardausgabe

`nb env proxy nginx` verwaltet diese Dateien unter `~/.nocobase/proxy/nginx/`:

| Datei | Zweck |
| --- | --- |
| `~/.nocobase/proxy/nginx/<env>/app.conf` | Bearbeitbare Site-Einstiegsdatei. Die CLI aktualisiert den verwalteten Block darin, und du kannst darum herum eigene Site-Konfiguration ergänzen |
| `~/.nocobase/proxy/nginx/<env>/public/index-v1.html` | Von der aktuellen aktiven Client-`index.html` erzeugte Fallback-Seite für die v1-SPA |
| `~/.nocobase/proxy/nginx/<env>/public/index-v2.html` | Von der aktuellen aktiven Client-`v/index.html` erzeugte Fallback-Seite für die v2-SPA |
| `~/.nocobase/proxy/nginx/nocobase.conf` | Gemeinsame Hauptkonfiguration, die alle `app.conf`-Dateien der envs einbindet |
| `~/.nocobase/proxy/nginx/snippets/` | Gemeinsames Snippets-Verzeichnis, das aus den eingebauten Vorlagen kopiert wird |

Dabei gilt:

- `app.conf` ist bearbeitbar, aber du solltest den verwalteten Block zwischen `# BEGIN NocoBase managed config` und `# END NocoBase managed config` beibehalten
- `index-v1.html` und `index-v2.html` schreiben Asset-URLs automatisch passend zum aktuellen Env-Subpfad, zur aktiven Client-Version und zu `CDN_BASE_URL` um
- `nocobase.conf` wird hauptsächlich von `--install` verwendet
- Dateien unter `public/` und `snippets/` sind normalerweise nicht für manuelle Änderungen gedacht und werden beim nächsten Ausführen des Befehls erneut synchronisiert

:::warning Hinweis

Wenn du Site-spezifische Nginx-Konfiguration ergänzen musst, bearbeite `app.conf`. Dateien unter `public/` oder `snippets/` solltest du nicht manuell ändern, weil sie beim nächsten Ausführen von `nb env proxy nginx` überschrieben werden.

:::

## Zugehörige Konfigurationseinträge

Diese CLI-Konfigurationseinträge beeinflussen die erzeugte Nginx-Ausgabe direkt:

| Konfigurationseintrag | Standardwert | Beschreibung |
| --- | --- | --- |
| `proxy.nb-cli-root` | CLI-Root, normalerweise das Home-Verzeichnis des aktuellen Benutzers | Ordnet den `.nocobase`-Pfad dem Root-Pfad zu, den Nginx tatsächlich sieht |
| `proxy.upstream-host` | `127.0.0.1` | Host, zu dem der Proxy den Verkehr zurück zur NocoBase-App weiterleitet |
| `bin.nginx` | `nginx` | Pfad zur Nginx-Programmdatei, die von `--install` oder `--reload` verwendet wird |

Die meisten Setups müssen `proxy.nb-cli-root` nicht ändern. Üblicherweise wird es nur gebraucht, wenn Nginx in einem anderen Container, unter einem anderen Mount-Root oder mit einer anderen Pfadsicht läuft.

## Hinweise

- `--port` muss eine Ganzzahl zwischen `1` und `65535` sein
- Der Upstream-Port der NocoBase-App kommt aus dem gespeicherten env `appPort`, nicht aus `--port`
- Wenn der Befehl meldet, dass `appPort` für das env fehlt, führe zuerst `nb env update <name>` aus oder speichere den Wert explizit mit `nb env update <name> --app-port <port>`
- Wenn du Einstellungen wie `app-port` oder `app-public-path` mit `nb env update` änderst, musst du `nb env proxy nginx` danach in der Regel erneut ausführen
- `--print` kann nicht mit `--install` oder `--reload` kombiniert werden
- Der Nginx-Provider unterstützt `--output` nicht

## Beispiele

```bash
# Nginx-Konfiguration für das aktuelle env erzeugen
nb env proxy nginx

# Konfiguration für ein bestimmtes env erzeugen
nb env proxy nginx --env demo

# Öffentlichen Host und Port in die Einstiegskonfiguration schreiben
nb env proxy nginx --env demo --host demo.local.nocobase.com --port 8080

# Die gerenderte app.conf ausgeben, ohne Dateien zu schreiben
nb env proxy nginx --env demo --print

# Den .nocobase-Pfad zuordnen, wenn Nginx unter einem anderen Mount-Root läuft
nb config set proxy.nb-cli-root /workspace

# Gemeinsame Konfiguration in die Nginx-Hauptkonfiguration installieren und direkt neu laden
nb env proxy nginx --env demo --install --reload
```

## Verwandte Befehle

- [`nb env proxy`](./index.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
