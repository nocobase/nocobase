---
title: "Caddy"
description: "Mit nb proxy caddy Caddy-Reverse-Proxy-Konfigurationen für CLI-verwaltete NocoBase-Envs erzeugen und verwalten."
keywords: "NocoBase,nb proxy caddy,reverse proxy,Caddy,Produktion"
---

# Caddy

Wenn du bereits eine Domain hast und HTTPS schnell verfügbar machen willst, ist `nb proxy caddy` normalerweise der einfachste Einstieg.

Verglichen damit, Zertifikatskonfigurationen in Nginx selbst zu pflegen, ist Caddy eher die Standard-Abkürzung, um die Entry-Ebene schnell online zu bringen.

## Wann Caddy die bessere Wahl ist

In der Praxis passt Caddy meist besser, wenn:

- du bereits eine Domain hast und HTTPS schnell live bringen willst
- du Zertifikate und TLS-Details nicht weitgehend selbst verwalten möchtest
- du vor allem eine einfache und stabile Entry-Ebene brauchst

Wenn du Nginx bereits verwendest, um viele Websites auf demselben Server zu verwalten, oder weiterhin umfangreiches Caching, Zugriffskontrolle oder eigene Regeln brauchst, ist [Nginx](./nginx.md) in der Regel die bessere Wahl.

## Empfohlene Reihenfolge: Driver wählen, Konfiguration erzeugen, dann starten

Für ein CLI-verwaltetes Env vom Typ `local` oder `docker` ist diese Reihenfolge normalerweise sinnvoll:

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Oder mit lokalem Prozess:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Häufige Folgekommandos sind:

```bash
nb proxy caddy current
nb proxy caddy status
nb proxy caddy info
nb proxy caddy reload
nb proxy caddy restart
nb proxy caddy stop
```

In den meisten Fällen gilt:

- `current` ist der schnellste Weg, den aktiven Runtime-Driver zu prüfen
- `status` zeigt, ob Caddy aktuell normal läuft
- `info` zeigt den aktuellen Konfigurationspfad, die Runtime-Root und weitere Runtime-Details
- nach einer neu erzeugten Konfiguration ist `reload` normalerweise der erste Befehl
- verwende `restart`, wenn ein vollständiger Neustart nötig ist

## Welche Eingaben `generate` braucht

Die häufigste Form ist:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Wenn du zusätzlich den Entry-Port angeben möchtest:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

Dabei bedeutet:

- `--env`: für welches CLI-Env die Konfiguration erzeugt werden soll
- `--host`: die öffentliche Domain
- `--port`: der Entry-Port des Proxys

Bei Caddy ist `--host` besonders wichtig, weil die Site-Adresse direkten Einfluss auf den HTTPS-Ablauf hat. In Produktion gibst du idealerweise eine Domain an, die bereits korrekt auf den aktuellen Server zeigt.

Wenn der Befehl meldet, dass `appPort` fehlt, speichere ihn zuerst:

```bash
nb env update test2 --app-port 56575
```

Wenn du später Einstellungen wie `app-port` oder `app-public-path` änderst, die das Proxy-Verhalten beeinflussen, führe `generate` erneut aus.

## Dateien, die von der CLI verwaltet werden

Am Beispiel von `test2` verwaltet der Caddy-Ablauf normalerweise:

| Pfad | Zweck |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | Vollständige, von der CLI erzeugte Site-Konfiguration |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | Entry-Datei auf Provider-Ebene, die alle `app.caddy`-Dateien der Envs importiert |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | SPA-Fallback-Seite für v1 |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | SPA-Fallback-Seite für v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Frontend-Build-Ausgabe der aktuellen Anwendung |
| `NB_CLI_ROOT/test2/storage/uploads` | Upload-Verzeichnis der aktuellen Anwendung |

Dabei gilt:

- Dateien unter `NB_CLI_ROOT/.nocobase/proxy/caddy/...` sind von der CLI verwaltete Proxy-Hilfsdateien
- Dateien unter `NB_CLI_ROOT/test2/storage/...` gehören zur Anwendung selbst
- `nocobase.caddy` ist die Entry-Datei auf Provider-Ebene und muss normalerweise nicht manuell bearbeitet werden
- `app.caddy` ist die vollständige Site-Konfiguration für ein Env und wird beim erneuten Generieren vollständig überschrieben

:::warning Hinweis

Wenn du Site-Level-Caddy-Konfiguration wie zusätzliche Header, Authentifizierung, Rate Limiting oder Kompressionsrichtlinien brauchst, kannst du `app.caddy` als Grundlage anpassen. Beachte aber, dass diese Datei beim erneuten Ausführen von `generate` überschrieben wird.

:::

## Handgeschriebene Konfiguration: wenn du die CLI nicht verwendest

Wenn die Anwendung nicht CLI-verwaltet ist oder du die vollständige Caddy-Konfiguration bewusst selbst pflegen willst, kannst du sie natürlich auch von Hand schreiben.

Für NocoBase ist ein produktionsreifer Entry in der Regel aber mehr als ein einfaches `reverse_proxy`. Zusätzlich zur Weiterleitung von API-Anfragen an die Backend-Anwendung muss eine vollständige Caddy-Konfiguration normalerweise auch Uploads, Frontend-Assets, `.well-known`-Routen, WebSocket und SPA-Fallback-Seiten gemeinsam abdecken.

Am Beispiel von `test2` sind diese Caddy-bezogenen Pfade besonders wichtig:

- SPA-Fallback-Verzeichnis: `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- Frontend-Build-Ausgabe: `NB_CLI_ROOT/test2/storage/dist-client`
- Upload-Verzeichnis: `NB_CLI_ROOT/test2/storage/uploads`

Mit anderen Worten: eine handgeschriebene Konfiguration muss normalerweise mindestens diese Entry-Bereiche abdecken:

- `v`: `/v` nach `/v/` umleiten
- `uploads`: Upload-Verzeichnis ausliefern
- `dist`: Frontend-Build-Ausgabe ausliefern
- `oauth well-known`: OAuth-Discovery-Pfad behandeln
- `openid well-known`: OpenID-Discovery-Pfad behandeln
- `api`: `/api/` an die Backend-Anwendung weiterleiten
- `ws`: WebSocket-Anfragen an die Backend-Anwendung weiterleiten
- `spa v2`: `/v/` mit dem v2-Entry und der Fallback-Seite ausliefern
- `spa v1`: `/` mit dem v1-Entry und der Fallback-Seite ausliefern

Eine vollständige Caddy-Konfiguration ist also meist deutlich mehr als ein generisches Beispiel wie:

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

Für eine CLI-verwaltete Anwendung wie `test2` sieht eine realistischere Struktur typischerweise eher so aus:

```text
c.local.nocobase.com {
    encode zstd gzip

    handle /v {
        redir * /v/ 302
    }

    handle_path /storage/uploads/* {
        root * NB_CLI_ROOT/test2/storage/uploads
        header Cache-Control public
        header X-Content-Type-Options nosniff
        file_server
    }

    handle_path /dist/* {
        root * NB_CLI_ROOT/test2/storage/dist-client
        header Cache-Control public
        file_server
    }

    @oauth path_regexp oauth ^/\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\.well-known/openid-configuration/(.+)$
    handle @openid {
        rewrite * /{re.openid.1}/.well-known/openid-configuration
        reverse_proxy host.docker.internal:56575
    }

    handle /api/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /ws {
        reverse_proxy host.docker.internal:56575
    }

    handle_path /v/* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v2.html
        file_server
    }

    handle_path /* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v1.html
        file_server
    }
}
```

Zwei Details sind hier besonders wichtig:

- Dateien unter `NB_CLI_ROOT/.nocobase/proxy/caddy/...` sind von der CLI verwaltete SPA-Fallback-Dateien
- Dateien unter `NB_CLI_ROOT/test2/storage/...` gehören zur Build-Ausgabe und zu den Uploads der Anwendung selbst

Wenn die Anwendung mit Subpfaden arbeitet oder Frontend-Assets, Uploads und Entry-Ebene nicht dieselbe Pfadsicht teilen, sind handgeschriebene Konfigurationen besonders fehleranfällig. In solchen Fällen ist es meist sicherer, die Konfiguration zuerst zu erzeugen:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Und die erzeugte Struktur dann als Grundlage für manuelle Anpassungen zu verwenden.

Wenn du zuerst von der CLI Routing und Pfade korrekt aufsetzen lassen willst, sieht die erzeugte Struktur typischerweise so aus:

```text
NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html
NB_CLI_ROOT/test2/storage/dist-client
NB_CLI_ROOT/test2/storage/uploads
```

Dabei gilt:

- `nocobase.caddy` importiert alle `*/app.caddy`-Dateien
- `test2/app.caddy` ist die vollständige Site-Konfiguration für das Env `test2`
- `public/index-v1.html` und `public/index-v2.html` sind von der CLI erzeugte SPA-Fallback-Seiten

Der sicherere Ablauf ist meistens:

1. zuerst die Caddy-Konfiguration von der CLI erzeugen lassen
2. anhand der erzeugten Ausgabe Routing-Struktur und reale Dateisystempfade prüfen
3. erst danach für Domain, Runtime-Driver und Mount-Layout anpassen

Das ist normalerweise deutlich weniger fehleranfällig, als die vollständige Konfiguration von Grund auf selbst zu schreiben.

## Konfiguration prüfen und neu laden

Wenn du Caddy-Konfiguration von Hand schreibst oder anpasst, prüfe sie zuerst und lade sie danach neu:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Wenn du Caddy nicht mit `systemd` verwaltest, ersetze das durch deinen eigenen Start- und Reload-Ablauf.

Wenn du die Entry-Ebene über `nb proxy caddy` verwaltest, ist der übliche erste Schritt:

```bash
nb proxy caddy reload
```

Wenn du den aktuellen Driver, den Pfad zur Hauptkonfiguration, die Runtime-Root und Details zu Container oder lokaler Binärdatei sehen möchtest, führe aus:

```bash
nb proxy caddy info
```

Wenn du nur schnell prüfen willst, ob Caddy bereits läuft, verwende:

```bash
nb proxy caddy status
```

## Häufige Hinweise

- `nb proxy caddy generate` funktioniert nur für CLI-verwaltete Envs, deren Runtime vom aktuellen Rechner aus erreichbar ist, also `local` oder `docker`
- wenn der Befehl meldet, dass `appPort` fehlt, führe zuerst `nb env update <name> --app-port <port>` aus
- wenn du bereits eine Domain hast, die korrekt auf den aktuellen Server zeigt, ist Caddy oft der schnellste Weg zu HTTPS
- wenn du später Einstellungen wie `app-port` oder `app-public-path` änderst, die das Proxy-Verhalten beeinflussen, führe `generate` erneut aus

## Verwandte Links

- [Reverse Proxy in Produktion](./index.md)
- [Nginx](./nginx.md)
- [Mit der CLI installieren](../../installation/cli.md)
- [Mit Docker Compose installieren](../../installation/docker-compose.md)
- [Umgebungsvariablen](../../installation/env.md)
