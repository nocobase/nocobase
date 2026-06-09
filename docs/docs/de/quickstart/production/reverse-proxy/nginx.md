---
title: "Nginx"
description: "Mit nb proxy nginx Nginx-Reverse-Proxy-Konfigurationen für CLI-verwaltete NocoBase-Envs erzeugen und verwalten."
keywords: "NocoBase,nb proxy nginx,reverse proxy,Nginx,Produktion"
---

# Nginx

Wenn du auf dem Server bereits Nginx für Websites verwendest oder Zertifikate, Caching und Zugriffskontrolle weiterhin selbst verwalten möchtest, ist `nb proxy nginx` der empfohlene Weg.

Wenn es dir nur darum geht, HTTPS möglichst schnell bereitzustellen und dabei möglichst wenig Proxy-Details selbst zu pflegen, ist [Caddy](./caddy.md) normalerweise die einfachere Wahl. Wenn Nginx aber ohnehin Teil deines Server-Setups ist, ist diese Seite der Standardpfad.

## Wann Nginx die bessere Wahl ist

In der Praxis passt Nginx meist besser, wenn:

- du Nginx bereits verwendest, um mehrere Websites auf demselben Server zu verwalten
- du Zertifikate, Caching, Zugriffskontrolle oder weitere eigene Regeln weiterhin selbst pflegen musst
- die Entry-Ebene zu deinem bestehenden Nginx-Betriebsablauf passen soll

Wenn das einzige Ziel ist, HTTPS mit möglichst wenig TLS-Arbeit schnell online zu bringen, ist [Caddy](./caddy.md) in der Regel der einfachere Weg.

## Empfohlene Reihenfolge: Driver wählen, Konfiguration erzeugen, dann starten

Für ein CLI-verwaltetes Env vom Typ `local` oder `docker` ist diese Reihenfolge normalerweise sinnvoll:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Oder mit lokalem Prozess:

```bash
nb proxy nginx use local
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Häufige Folgekommandos sind:

```bash
nb proxy nginx current
nb proxy nginx status
nb proxy nginx info
nb proxy nginx reload
nb proxy nginx restart
nb proxy nginx stop
```

In den meisten Fällen gilt:

- `current` ist der schnellste Weg, den aktiven Runtime-Driver zu prüfen
- `status` zeigt, ob Nginx aktuell normal läuft
- `info` zeigt den aktuellen Konfigurationspfad, die Runtime-Root und weitere Runtime-Details
- nach einer neu erzeugten Konfiguration ist `reload` normalerweise der erste Befehl
- verwende `restart`, wenn ein vollständiger Neustart nötig ist

## Welche Eingaben `generate` braucht

Die häufigste Form ist:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Wenn du zusätzlich den Entry-Port angeben möchtest:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

Dabei bedeutet:

- `--env`: für welches CLI-Env die Konfiguration erzeugt werden soll
- `--host`: die öffentliche Domain
- `--port`: der Entry-Port des Proxys, nicht der `appPort` der Anwendung selbst

Der Upstream-Port der Anwendung stammt aus dem gespeicherten `appPort` dieses Env. Wenn der Befehl meldet, dass `appPort` fehlt, speichere ihn zuerst:

```bash
nb env update test2 --app-port 56575
```

Wenn du später Einstellungen wie `app-port` oder `app-public-path` änderst, die das Proxy-Verhalten beeinflussen, führe `generate` erneut aus.

## Dateien, die von der CLI verwaltet werden

Am Beispiel von `test2` verwaltet der Nginx-Ablauf normalerweise:

| Pfad | Zweck |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Gemeinsames Nginx-Snippets-Verzeichnis |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Bearbeitbare Site-Entry-Konfiguration |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | SPA-Fallback-Seite für v1 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | SPA-Fallback-Seite für v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Frontend-Build-Ausgabe der aktuellen Anwendung |
| `NB_CLI_ROOT/test2/storage/uploads` | Upload-Verzeichnis der aktuellen Anwendung |

Dabei gilt:

- Dateien unter `NB_CLI_ROOT/.nocobase/proxy/nginx/...` sind von der CLI verwaltete Proxy-Hilfsdateien
- Dateien unter `NB_CLI_ROOT/test2/storage/...` gehören zur Anwendung selbst
- `app.conf` kann bearbeitet werden, der von NocoBase verwaltete Block muss aber erhalten bleiben
- `index-v1.html` und `index-v2.html` werden passend zum Subpfad des aktuellen Env, zur aktiven Client-Version und zu `CDN_BASE_URL` umgeschrieben

:::warning Hinweis

Wenn du Site-Level-Nginx-Konfiguration wie Rate Limiting, zusätzliche Header oder Zugriffskontrolle brauchst, bearbeite `app.conf`. Die von der CLI verwalteten Hilfsdateien werden beim erneuten Generieren wieder synchronisiert.

:::

## Handgeschriebene Konfiguration: wenn du die CLI nicht verwendest

Wenn die Anwendung nicht CLI-verwaltet ist oder du die vollständige Nginx-Konfiguration bewusst selbst pflegen willst, kannst du sie natürlich auch von Hand schreiben.

Für NocoBase ist ein produktionsreifer Reverse Proxy aber in der Regel mehr als ein einzelnes `proxy_pass`. Zusätzlich zur Weiterleitung von API-Anfragen an die Backend-Anwendung muss eine vollständige Konfiguration normalerweise auch Uploads, Frontend-Assets, WebSocket, `.well-known`-Routen und SPA-Fallback-Seiten gemeinsam abdecken.

Am Beispiel von `test2` sind diese Nginx-bezogenen Dateien und Verzeichnisse besonders wichtig:

- Nginx-Snippets: `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- Bearbeitbare Entry-Konfiguration: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- SPA-Fallback-Seite für v1: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- SPA-Fallback-Seite für v2: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- Frontend-Build-Ausgabe: `NB_CLI_ROOT/test2/storage/dist-client`
- Upload-Verzeichnis: `NB_CLI_ROOT/test2/storage/uploads`

Mit anderen Worten: eine handgeschriebene Konfiguration muss normalerweise mindestens diese Entry-Bereiche abdecken:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

Eine vollständige Nginx-Konfiguration ist also meist deutlich mehr als ein generisches Reverse-Proxy-Beispiel wie dieses:

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

Für eine CLI-verwaltete Anwendung wie `test2` sieht eine realistischere Struktur typischerweise eher so aus:

```nginx
server {
    listen 80;
    server_name c.local.nocobase.com;

    # Add custom directives or locations above the managed block as needed.

    client_max_body_size 0;

    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/mime-types.conf;
    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/gzip.conf;

    location /storage/uploads/ {
        alias NB_CLI_ROOT/test2/storage/uploads/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/uploads-location.conf;
    }

    location ^~ /dist/ {
        alias NB_CLI_ROOT/test2/storage/dist-client/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/dist-location.conf;
    }

    location ~ ^/\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {
        rewrite ^ /$resource_path/.well-known/$well_known break;
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /ws {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /v {
        return 302 /v/$is_args$args;
    }

    location ^~ /v/ {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v2.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    location ^~ / {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v1.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    # Add custom directives or locations below the managed block as needed.
}
```

Zwei Details sind hier besonders wichtig:

- Dateien unter `NB_CLI_ROOT/.nocobase/proxy/nginx/...` sind CLI-verwaltete Proxy-Hilfsdateien
- Dateien unter `NB_CLI_ROOT/test2/storage/...` gehören zur Build-Ausgabe und zu den Uploads der Anwendung selbst

Wenn die Anwendung mit Subpfaden arbeitet oder Frontend-Assets, Uploads und Reverse Proxy nicht dieselbe Pfadsicht teilen, sind handgeschriebene Konfigurationen besonders fehleranfällig. In solchen Fällen ist es meist sicherer, die Konfiguration zuerst zu erzeugen:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Und die erzeugte Struktur dann als Grundlage für manuelle Anpassungen zu verwenden.

Der sicherere Ablauf ist meistens:

1. zuerst die Nginx-Konfiguration von der CLI erzeugen lassen
2. anhand der erzeugten Ausgabe Routing-Struktur und reale Dateisystempfade prüfen
3. erst danach für Domain, Runtime-Driver und Mount-Layout anpassen

Das ist normalerweise deutlich weniger fehleranfällig, als die vollständige Konfiguration von Grund auf selbst zu schreiben.

## Konfiguration prüfen und neu laden

Wenn du Nginx-Konfiguration von Hand schreibst oder anpasst, prüfe sie zuerst und lade sie danach neu:

```bash
nginx -t
systemctl reload nginx
```

Wenn du Nginx nicht mit `systemd` verwaltest, ersetze das durch deinen eigenen Reload-Ablauf.

Wenn du die Entry-Ebene über `nb proxy nginx` verwaltest, ist der übliche erste Schritt:

```bash
nb proxy nginx reload
```

## HTTPS handhaben

Wenn du dich entschieden hast, bei Nginx zu bleiben, kannst du HTTPS dort ebenfalls weiterführen. Ein typisches Muster ist, `listen 80` auf eine `80/443`-Konfiguration zu erweitern und anschließend Zertifikatspfade und TLS-Einstellungen zu ergänzen.

Wenn dein Ziel einfach nur ist, schnell nutzbares HTTPS zu bekommen, ohne Zertifikate selbst auszustellen und zu erneuern, ist ein Wechsel zu [Caddy](./caddy.md) in der Regel einfacher.

## Häufige Hinweise

- `nb proxy nginx generate` funktioniert nur für CLI-verwaltete Envs, deren Runtime vom aktuellen Rechner aus erreichbar ist, also `local` oder `docker`
- wenn der Befehl meldet, dass `appPort` fehlt, führe zuerst `nb env update <name> --app-port <port>` aus
- wenn du bereits eine große Nginx-Hauptkonfiguration hast, eignet sich die von der CLI erzeugte Konfiguration in der Regel besser als Site-Fragment statt als vollständiger Ersatz
- wenn du später Einstellungen wie `app-port` oder `app-public-path` änderst, die das Proxy-Verhalten beeinflussen, führe `generate` erneut aus

## Verwandte Links

- [Reverse Proxy in Produktion](./index.md)
- [Caddy](./caddy.md)
- [Mit der CLI installieren](../../installation/cli.md)
- [Mit Docker Compose installieren](../../installation/docker-compose.md)
- [Umgebungsvariablen](../../installation/env.md)
