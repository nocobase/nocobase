#Nginx

Wenn Sie Nginx zum Verwalten der Site auf dem Server verwendet haben oder sich später um Zertifikate, Caches und Zugriffskontrolle kümmern müssen, ist `nb proxy nginx` der standardmäßig empfohlene Pfad.

Wenn Sie HTTPS nur so schnell wie möglich konfigurieren und nicht zu viele Proxy-Details selbst verwalten möchten, ist [Caddy](./caddy.md) eine sorgenfreiere Lösung. Solange Sie jedoch Nginx verwenden, ist dieses Dokument der Standardpfad.

## Wann ist die Verwendung von Nginx besser geeignet?

Im Allgemeinen geben die folgenden Situationen der weiteren Verwendung von Nginx Vorrang:

- Sie haben Nginx verwendet, um mehrere Sites auf dem Server zu verwalten.
- Zertifikate, Caches, Zugriffskontrollen oder weitere benutzerdefinierte Regeln müssen Sie später selbst verwalten
- Sie möchten, dass die Einstiegsschicht weiterhin die bestehende Nginx-Betriebs- und Wartungsmethode verwendet

Wenn Ihr Ziel nur darin besteht, HTTPS so schnell wie möglich durchzubringen, und Sie nicht zu viele TLS-Details selbst verwalten möchten, ist [Caddy](./caddy.md) eine sorgenfreie Lösung.

## Befolgen Sie zunächst diese drei Befehle.

Wenn Sie zunächst nur die Nginx-Einstiegsschicht ausführen möchten, reicht es aus, sich standardmäßig diese drei Befehle zu merken:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Wenn Nginx lokal installiert wurde, ändern Sie einfach den ersten Eintrag in `nb proxy nginx use local`.

In den meisten Szenarien reicht es aus, zuerst `use`, dann `generate` und schließlich `reload` auszuführen. Weitere Details und weitere Befehle finden Sie in den folgenden Kapiteln oder in der CLI-Referenz.

## Schritt 1: Wählen Sie zunächst aus, wie Sie Nginx selbst ausführen möchten

Wenn Nginx bereits auf dem aktuellen Computer installiert ist, verwenden Sie einfach `use local`.

Wenn Sie die Docker-Version von Nginx verwenden möchten, verwenden Sie `use docker`.

Der `local` / `docker` bezieht sich hier auf den Betriebsmodus von **Nginx selbst**.

Verwendung der Docker-Version von Nginx:

```bash
nb proxy nginx use docker
```

Verwendung eines lokal installierten Nginx:

```bash
nb proxy nginx use local
```

Wenn Sie später vergessen, welche Methode aktuell ausgewählt ist, können Sie Folgendes ausführen:

```bash
nb proxy nginx current
```

## Schritt 2: `generate` ausführen

`generate` wird verwendet, um die Nginx-Eintragskonfiguration gemäß der angegebenen Umgebung zu generieren. Die gebräuchlichste Schreibweise ist:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Wenn Sie auch den Eintrittsport angeben möchten, können Sie ihn auch zusammenschreiben:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

Die Bedeutung der Parameter hier ist:

- `--env`: Geben Sie an, für welche CLI-Umgebung die Konfiguration generiert werden soll
- `--host`: Geben Sie den Domänennamen für den externen Zugriff an
- `--port`: Gibt den Proxy-Eintragsport an, nicht den `appPort` der NocoBase-Anwendung selbst

Der Upstream-Anwendungsport stammt aus dem gespeicherten `appPort` dieser Umgebung. Wenn der Befehl Sie dazu auffordert, dass env `appPort` fehlt, führen Sie Folgendes aus:

```bash
nb env update test2 --app-port 56575
```

Wenn Sie später Konfigurationen wie `app-port` und `app-public-path` ändern, die sich auf die Proxy-Ergebnisse auswirken, denken Sie daran, `generate` erneut auszuführen.

## Schritt 3: `reload` ausführen

Führen Sie nach dem Generieren der Konfiguration direkt Folgendes aus:

```bash
nb proxy nginx reload
```

In den meisten Szenarien verwenden Sie diesen Befehl einfach direkt. Wenn es noch nicht läuft, wird der Start zuerst intern verarbeitet; Wenn es bereits ausgeführt wird, wird es entsprechend der neuesten Konfiguration neu geladen.

## Welche Dateien werden von der CLI verwaltet?

Am Beispiel von `test2` verwalten Nginx-bezogene Befehle normalerweise diese Dateien und Verzeichnisse:

| Pfad | Funktion |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Nginx-Verzeichnis für freigegebene Snippets |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Bearbeitbare Site-Eintragskonfiguration |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | v1 SPA-Fallback-Seite |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | v2 SPA-Fallback-Seite |
| `NB_CLI_ROOT/test2/storage/dist-client` | Derzeit verwendetes Front-End-Build-Produktverzeichnis |
| `NB_CLI_ROOT/test2/storage/uploads` | Das Upload-Verzeichnis der aktuellen Anwendung |

In:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` Im Folgenden finden Sie Agentenhilfsdateien, die von der CLI verwaltet werden
- `NB_CLI_ROOT/test2/storage/...` Im Folgenden sind die eigenen statischen Ressourcen und Upload-Verzeichnisse der Anwendung aufgeführt
- `app.conf` kann geändert werden, der verwaltete NocoBase-Block muss jedoch beibehalten werden
– `index-v1.html` und `index-v2.html` schreiben Ressourcenadressen automatisch entsprechend dem aktuellen Umgebungs-Unterpfad, der aktiven Client-Version und `CDN_BASE_URL` um.

:::Warnhinweis

Wenn Sie eine Nginx-Konfiguration auf Site-Ebene hinzufügen möchten, z. B. Strombegrenzung, zusätzliche Header und Zugriffskontrolle, ändern Sie einfach `app.conf`. Von der CLI verwaltete Hilfsdateien werden bei nachfolgenden Neuerstellungen synchron aktualisiert.

:::

## Handschriftliche Konfiguration: Was tun ohne CLI?

Wenn Ihre Anwendung nicht über die CLI gehostet wird oder Sie die komplette Nginx-Konfiguration ausdrücklich selbst pflegen möchten, können Sie diese auch manuell schreiben.

Für NocoBase ist der Produktions-Reverse-Proxy jedoch normalerweise mehr als ein einfacher `proxy_pass`. Zusätzlich zur Weiterleitung von API-Anfragen an die Back-End-Anwendung muss eine vollständige und nutzbare Konfiguration normalerweise das Upload-Verzeichnis, die statischen Front-End-Ressourcen, die Dateizugriffsroute `/files/`, WebSocket, die `.well-known`-Route und SPA-Fallback-Seiten verwalten.

Am Beispiel von `test2` umfassen wichtige Dateien und Verzeichnisse im Zusammenhang mit Nginx normalerweise:

- Nginx-Schnipsel: `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- Bearbeitbare Eintragskonfiguration: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- SPA-Fallback-Seite (v1): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- SPA-Fallback-Seite (v2): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- Front-End-Build-Produktverzeichnis: `NB_CLI_ROOT/test2/storage/dist-client`
- Verzeichnis hochladen: `NB_CLI_ROOT/test2/storage/uploads`

Mit anderen Worten: Die handschriftliche Konfiguration muss in der Regel mindestens die folgenden Arten von Einträgen abdecken:

- `uploads`: Stellen Sie das Upload-Verzeichnis über `alias` bereit.
- `dist`: Machen Sie das Front-End-Build-Produktverzeichnis über `alias` verfügbar.
- `well-known`: Behandelt OAuth-/OpenID-bezogene Erkennungspfade
- `files`: Leitet Dateizugriffsanfragen unter `/files/` an die Backend-Anwendung weiter
- `api`: `/api/`-Anfrage an die Backend-Anwendung weiterleiten
- `ws`: WebSocket-Anfragen an die Backend-Anwendung weiterleiten
- `spa`: Bietet Front-End-Eintrag und `try_files` Fallback für `/` und `/v/`

Daher besteht eine vollständige Nginx-Konfiguration normalerweise nicht nur aus der folgenden allgemeinen Reverse-Proxy-Schreibmethode:

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

Für eine CLI-gehostete Anwendung wie `test2` würde eine Struktur, die einer echten Bereitstellung näher kommt, normalerweise wie folgt aussehen:

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

    location ~ ^/\\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {
        rewrite ^ /$resource_path/.well-known/$well_known break;
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location ^~ /files/ {
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

Hier gibt es zwei wesentliche Punkte:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` Im Folgenden finden Sie Agentenhilfsdateien, die von der CLI verwaltet werden
- `NB_CLI_ROOT/test2/storage/...` Im Folgenden verwenden Sie Ihr eigenes Produktverzeichnis und Upload-Verzeichnis

Wenn Ihre Anwendung die Unterpfadbereitstellung verwendet oder sich die Front-End-Ressourcen, das Upload-Verzeichnis und der Reverse-Proxy nicht in derselben Pfadperspektive befinden, ist die handschriftliche Konfiguration fehleranfälliger. In diesem Szenario empfiehlt es sich normalerweise, Folgendes auszuführen:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Nehmen Sie dann Anpassungen basierend auf den generierten Ergebnissen vor.

Ein umsichtigerer Ansatz ist normalerweise:

1. Lassen Sie zunächst die CLI die Nginx-Konfiguration generieren
2. Bestätigen Sie die Routing-Struktur und den tatsächlichen Pfad basierend auf den generierten Ergebnissen.
3. Nehmen Sie dann manuelle Anpassungen entsprechend Ihrem Domainnamen, Ausführungsmodus und Bereitstellungspfad vor.

Dabei ist es in der Regel weniger wahrscheinlich, dass Details zu `/files/`, WebSockets, statischen Ressourcen, Upload-Verzeichnissen oder SPA-Fallback-Seiten übersehen werden, als wenn Sie eine Konfiguration von Grund auf neu schreiben.

:::warning Hinweis

`/files/` ist eine Anwendungsroute, die die NocoBase-Autorisierung durchlaufen muss. Behandeln Sie sie nicht als statisches Verzeichnis und lassen Sie sie nicht in den SPA-Fallback fallen. Leiten Sie die Route an das NocoBase-Backend weiter und platzieren Sie die Regel vor `location /` und anderen Front-End-Fallback-Regeln.

Wenn `APP_PUBLIC_PATH=/nocobase/` konfiguriert ist, leiten Sie zusätzlich `/nocobase/files/` weiter. Behalten Sie die Root-Regel `/files/` zur Kompatibilität mit vorhandenen Datei-URLs bei.

:::

## Wie man mit HTTPS umgeht

Wenn Sie sich für die weitere Nutzung von Nginx entschieden haben, kann HTTPS auch weiterhin in Nginx konfiguriert werden. Eine gängige Praxis besteht darin, `listen 80` auf `80/443` mit doppeltem Eintrag zu erweitern und dann den Zertifikatspfad und die TLS-Konfiguration hinzuzufügen.

Wenn Sie jedoch einfach nur so schnell wie möglich verfügbares HTTPS erhalten möchten und sich nicht selbst um die Beantragung und Erneuerung des Zertifikats kümmern möchten, können Sie problemlos [Caddy](./caddy.md) direkt verwenden.

## Allgemeine Anweisungen

- `nb proxy nginx generate` ist für Anwendungen, die von `nb init` installiert wurden
- Wenn Sie später Konfigurationen wie `app-port` und `app-public-path` ändern, die sich auf die Proxy-Ergebnisse auswirken, denken Sie daran, `generate` erneut auszuführen.

## Verwandte Links

- [Reverse-Proxy der Produktionsumgebung](./index.md)
- [Caddy](./caddy.md)
- [Mit CLI installieren (empfohlen)](../../installation/cli.md)
- [Anwendungskonfiguration mit `.env`](../../installation/env.md)
- [`nb proxy nginx` Befehlsreferenz](../../../api/cli/proxy/nginx/index.md)
