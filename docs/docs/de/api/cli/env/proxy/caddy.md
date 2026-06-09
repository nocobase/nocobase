---
title: 'nb env proxy caddy'
description: 'Referenz zur Befehlsgruppe nb env proxy caddy: Erzeugt eine Caddy-Proxy-Konfiguration für ein von der CLI verwaltetes env.'
keywords: 'nb env proxy caddy,NocoBase CLI,caddy,reverse proxy,Proxy-Konfiguration'
---

# nb env proxy caddy

`nb env proxy caddy` erzeugt eine Caddy-Proxy-Konfiguration für ein von der CLI verwaltetes env. Der Befehl passt gut, wenn du bereits eine Domain hast, HTTPS schnell aktivieren möchtest und dich nicht selbst um zu viele TLS-Details kümmern willst.

Dieser Befehl funktioniert nur für verwaltete envs, deren Runtime von der aktuellen Maschine aus erreichbar ist, also `local` oder `docker`. Für envs mit ausschließlich entfernter API-Verbindung oder für SSH-envs wird er derzeit nicht unterstützt.

## Verwendung

```bash
nb env proxy caddy [name] [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `[name]` | string | Name des konfigurierten env, für das eine Proxy-Konfiguration erzeugt werden soll. Ohne Angabe wird das aktuelle env verwendet |
| `--env`, `-e` | string | Env-Namen explizit angeben. Diese Form ist meist die bessere Wahl |
| `--output`, `-o` | string | Pfad zur Ausgabedatei. Es wird nur die erzeugte Routen-Konfiguration geschrieben, ohne zusätzlich `app.caddy` oder die gemeinsame Hauptkonfiguration anzulegen |
| `--host` | string | Hostname, der in die Einstiegskonfiguration geschrieben wird, etwa `example.com` oder `localhost` |
| `--port` | string | Port, der in die Einstiegskonfiguration geschrieben wird. Das ist der Eingangsport des Proxys, nicht der Upstream-Port der NocoBase-App |
| `--install` | boolean | Installiert die gemeinsame Proxy-Konfiguration in die Caddy-Hauptkonfiguration |
| `--reload` | boolean | Prüft und lädt Caddy neu, nachdem Dateien geschrieben wurden |
| `--print` | boolean | Gibt die erzeugte Routen-Konfiguration direkt aus, statt Dateien zu schreiben |

## Standardausgabe

Wenn du `--output` nicht angibst, verwaltet die CLI diese Dateien unter `~/.nocobase/proxy/caddy/`:

| Datei | Zweck |
| --- | --- |
| `~/.nocobase/proxy/caddy/<env>/generated.caddy` | Die eigentliche Reverse-Proxy-Konfiguration, die von der CLI verwaltet und bei jedem Lauf überschrieben wird |
| `~/.nocobase/proxy/caddy/<env>/app.caddy` | Bearbeitbare Site-Einstiegsdatei, in der du Site-spezifische Konfiguration ergänzen kannst |
| `~/.nocobase/proxy/caddy/nocobase.caddy` | Gemeinsame Hauptkonfiguration, die alle `app.caddy`-Dateien der envs importiert |

Dabei gilt:

- `generated.caddy` ist ausschließlich für die Verwaltung durch die CLI gedacht und sollte nicht manuell bearbeitet werden
- `app.caddy` ist bearbeitbar, aber du solltest den von der CLI eingefügten Import der verwalteten Konfiguration beibehalten
- `nocobase.caddy` wird hauptsächlich von `--install` verwendet

:::warning Hinweis

Wenn du Site-spezifische Caddy-Konfiguration ergänzen musst, bearbeite `app.caddy`. `generated.caddy` wird beim nächsten Ausführen von `nb env proxy caddy` überschrieben.

:::

Wenn du `--output` angibst, schreibt die CLI nur die erzeugte Konfiguration in diese Datei und erstellt oder aktualisiert weder `app.caddy` noch die gemeinsame Hauptkonfiguration.

## Zugehörige Konfigurationseinträge

Diese CLI-Konfigurationseinträge beeinflussen die erzeugte Caddy-Ausgabe direkt:

| Konfigurationseintrag | Standardwert | Beschreibung |
| --- | --- | --- |
| `proxy.nb-cli-root` | CLI-Root, normalerweise das Home-Verzeichnis des aktuellen Benutzers | Ordnet den `.nocobase`-Pfad dem Root-Pfad zu, den Caddy tatsächlich sieht |
| `proxy.upstream-host` | `127.0.0.1` | Host, zu dem der Proxy den Verkehr zurück zur NocoBase-App weiterleitet |
| `bin.caddy` | `caddy` | Pfad zur Caddy-Programmdatei, die von `--install` oder `--reload` verwendet wird |

Die meisten Setups müssen `proxy.nb-cli-root` nicht ändern. Üblicherweise wird es nur gebraucht, wenn Caddy in einem anderen Container, unter einem anderen Mount-Root oder mit einer anderen Pfadsicht läuft.

## Hinweise

- `--host` ist wichtig. Caddy entscheidet anhand der Site-Adresse, ob HTTPS automatisch verwaltet wird. In Produktion solltest du möglichst eine Domain angeben, die bereits auf den aktuellen Server zeigt
- `--port` muss eine Ganzzahl zwischen `1` und `65535` sein
- Der Upstream-Port der NocoBase-App kommt aus dem gespeicherten env `appPort`, nicht aus `--port`
- Wenn der Befehl meldet, dass `appPort` für das env fehlt, führe zuerst `nb env update <name>` aus oder speichere den Wert explizit mit `nb env update <name> --app-port <port>`
- Wenn du Einstellungen wie `app-port` oder `app-public-path` mit `nb env update` änderst, musst du `nb env proxy caddy` danach in der Regel erneut ausführen
- `--print` kann nicht mit `--install` oder `--reload` kombiniert werden
- `--output` kann nicht mit `--install` oder `--reload` kombiniert werden

## Beispiele

```bash
# Caddy-Konfiguration für das aktuelle env erzeugen
nb env proxy caddy

# Konfiguration für ein bestimmtes env erzeugen
nb env proxy caddy --env demo

# Öffentlichen Host und Port in die Einstiegskonfiguration schreiben
nb env proxy caddy --env demo --host demo.local.nocobase.com --port 8080

# Die erzeugte Routen-Konfiguration ausgeben, ohne Dateien zu schreiben
nb env proxy caddy --env demo --print

# Die erzeugte Routen-Konfiguration in eine benutzerdefinierte Datei schreiben
nb env proxy caddy --env demo --output ./generated.caddy

# Den .nocobase-Pfad zuordnen, wenn Caddy unter einem anderen Mount-Root läuft
nb config set proxy.nb-cli-root /workspace

# Gemeinsame Konfiguration in die Caddy-Hauptkonfiguration installieren und direkt neu laden
nb env proxy caddy --env demo --install --reload
```

## Verwandte Befehle

- [`nb env proxy`](./index.md)
- [`nb env proxy nginx`](./nginx.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
