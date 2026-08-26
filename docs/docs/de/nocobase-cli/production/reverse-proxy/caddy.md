#Caddie

Wenn Sie bereits einen Domainnamen haben und HTTPS so schnell wie möglich konfigurieren möchten, ist `nb proxy caddy` normalerweise die problemloseste Eingabemethode.

Anstatt die Zertifikatkonfiguration von Nginx selbst zu verwalten, ähnelt Caddy eher der Standardverknüpfung, um „zuerst die Einstiegsebene zu durchlaufen“.

## Wann ist es sinnvoller, Caddy zu verwenden?

Im Allgemeinen hat Caddy in folgenden Situationen Vorrang:

- Sie haben bereits einen Domainnamen und möchten so schnell wie möglich auf HTTPS zugreifen
- Sie möchten nicht zu viele Zertifikats- und TLS-Details selbst verwalten
- Alles, was Sie brauchen, ist eine einfache und stabile Eingangsschicht

Wenn Sie Nginx bereits zum Verwalten vieler Sites auf dem Server verwendet haben oder später umfangreichere Caching-, Zugriffskontroll- und Anpassungsregeln durchführen müssen, ist es einfacher, mit der Suche nach [Nginx](./nginx.md) fortzufahren.

## Befolgen Sie zunächst diese drei Befehle.

Wenn Sie zunächst nur die Caddy-Einstiegsebene ausführen möchten, genügt es, sich diese drei Standardbefehle zu merken:

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy reload
```

Wenn Caddy lokal installiert wurde, ändern Sie einfach den ersten Eintrag in `nb proxy caddy use local`.

In den meisten Szenarien reicht es aus, zuerst `use`, dann `generate` und schließlich `reload` auszuführen. Weitere Details und weitere Befehle finden Sie in den folgenden Kapiteln oder in der CLI-Referenz.

## Schritt 1: Wählen Sie selbst, wie Sie Caddy ausführen möchten

Wenn Caddy bereits auf dem aktuellen Computer installiert ist, verwenden Sie einfach `use local`.

Wenn Sie die Docker-Version von Caddy verwenden möchten, verwenden Sie `use docker`.

Der `local` / `docker` bezieht sich hier auf die Art und Weise, wie **Caddy selbst funktioniert**.

Verwendung der Docker-Version von Caddy:

```bash
nb proxy caddy use docker
```

Mit einer lokalen Installation von Caddy:

```bash
nb proxy caddy use local
```

Wenn Sie später vergessen, welche Methode aktuell ausgewählt ist, können Sie Folgendes ausführen:

```bash
nb proxy caddy current
```

## Schritt 2: `generate` ausführen

`generate` wird verwendet, um die Caddy-Konfiguration gemäß der angegebenen Umgebung zu generieren. Die gebräuchlichste Schreibweise ist:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Wenn Sie auch den Eintrittsport angeben möchten, können Sie ihn auch zusammenschreiben:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

Die Bedeutung der Parameter hier ist:

- `--env`: Geben Sie an, für welche CLI-Umgebung die Konfiguration generiert werden soll
- `--host`: Geben Sie den Domänennamen für den externen Zugriff an
- `--port`: Geben Sie den Proxy-Eintragsport an

Für Caddy ist `--host` besonders wichtig. Versuchen Sie in einer formalen Umgebung, einen aufgelösten Domänennamen standardmäßig an den aktuellen Server zu übergeben, damit der HTTPS-Zugriff natürlicher erfolgt.

Wenn der Befehl anzeigt, dass env `appPort` fehlt, führen Sie zuerst Folgendes aus:

```bash
nb env update test2 --app-port 56575
```

Wenn Sie später Konfigurationen wie `app-port` und `app-public-path` ändern, die sich auf die Proxy-Ergebnisse auswirken, denken Sie daran, `generate` erneut auszuführen.

## Schritt 3: `reload` ausführen

Führen Sie nach dem Generieren der Konfiguration direkt Folgendes aus:

```bash
nb proxy caddy reload
```

In den meisten Szenarien verwenden Sie diesen Befehl einfach direkt. Wenn es noch nicht läuft, wird der Start zuerst intern verarbeitet; Wenn es bereits ausgeführt wird, wird es entsprechend der neuesten Konfiguration neu geladen.

## Welche Dateien werden von der CLI verwaltet?

Am Beispiel von `test2` verwalten Caddy-bezogene Befehle normalerweise diese Dateien und Verzeichnisse:

| Pfad | Funktion |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | Vollständige Site-Konfiguration, generiert von CLI |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | Allgemeine Caddy-Eintragsdatei, verantwortlich für den Import aller Umgebungen `app.caddy` |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | v1 SPA-Fallback-Seite |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | v2 SPA-Fallback-Seite |
| `NB_CLI_ROOT/test2/storage/dist-client` | Derzeit verwendetes Front-End-Build-Produktverzeichnis |
| `NB_CLI_ROOT/test2/storage/uploads` | Das Upload-Verzeichnis der aktuellen Anwendung |

In:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` Im Folgenden finden Sie Agentenhilfsdateien, die von der CLI verwaltet werden
- `NB_CLI_ROOT/test2/storage/...` Im Folgenden sind die eigenen statischen Ressourcen und Upload-Verzeichnisse der Anwendung aufgeführt
- `nocobase.caddy` ist eine Eintragsdatei auf Anbieterebene und muss normalerweise nicht manuell geändert werden.
- `app.caddy` ist die vollständige Caddy-Site-Konfiguration einer bestimmten Umgebung. Durch eine erneute Ausführung von `generate` wird alles überschrieben

:::Warnhinweis

Wenn Sie die Caddy-Konfiguration auf Site-Ebene ausgleichen möchten, z. B. zusätzliche Header, Authentifizierung, Geschwindigkeitsbegrenzung oder Komprimierungsstrategien, können Sie zunächst eine Anpassung basierend auf `app.caddy` vornehmen. Beachten Sie jedoch, dass nachfolgende erneute Ausführungen von `generate` diese Datei überschreiben.

:::

## Handschriftliche Konfiguration: Was tun ohne CLI?

Wenn Ihre Anwendung nicht CLI-gehostet ist oder Sie die komplette Caddy-Konfiguration ausdrücklich selbst pflegen möchten, können Sie diese auch manuell schreiben.

Für NocoBase ist der Produktionsumgebungseintrag jedoch normalerweise nicht nur ein einfacher `reverse_proxy`. Neben der Weiterleitung von API-Anfragen an die Backend-Anwendung muss eine vollständige und funktionierende Caddy-Konfiguration in der Regel auch das Upload-Verzeichnis, statische Front-End-Ressourcen, `.well-known`-Routing, WebSocket und SPA-Fallback-Seite verwalten.

Am Beispiel von `test2` umfassen die wichtigsten Verzeichnisse im Zusammenhang mit Caddy normalerweise:

– SPA-Fallback-Seitenverzeichnis: `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- Front-End-Build-Produktverzeichnis: `NB_CLI_ROOT/test2/storage/dist-client`
- Verzeichnis hochladen: `NB_CLI_ROOT/test2/storage/uploads`

Mit anderen Worten: Die handschriftliche Konfiguration muss in der Regel mindestens die folgenden Arten von Einträgen abdecken:

- `v`: `/v` zu `/v/` umleiten
- `uploads`: Upload-Verzeichnis verfügbar machen
- `dist`: Stellen Sie das Front-End-Build-Produktverzeichnis bereit
- `oauth well-known`: Behandelt OAuth-Erkennungspfade
- `openid well-known`: Behandelt OpenID-Erkennungspfade
- `api`: `/api/`-Anfrage an die Backend-Anwendung weiterleiten
- `ws`: WebSocket-Anfragen an die Backend-Anwendung weiterleiten
- `spa v2`: Bietet eine Front-End-Eingabe- und Rückgabeseite für `/v/`
- `spa v1`: Bietet eine Front-End-Eingabe- und Rückgabeseite für `/`

Daher wird eine vollständige Caddy-Konfiguration in der Regel nicht einfach so geschrieben:

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

Für eine CLI-gehostete Anwendung wie `test2` würde eine Struktur, die einer echten Bereitstellung näher kommt, normalerweise wie folgt aussehen:

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

    @oauth path_regexp oauth ^/\\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\\.well-known/openid-configuration/(.+)$
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

Auch hier gibt es zwei wichtige Punkte:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` Das Folgende ist das von der CLI verwaltete SPA-Rollback-Seitenverzeichnis
- `NB_CLI_ROOT/test2/storage/...` Das Folgende ist die Verwendung Ihres eigenen Build-Produktverzeichnisses und Upload-Verzeichnisses

Wenn Ihre Anwendung die Unterpfadbereitstellung verwendet oder sich die Front-End-Ressourcen, das Upload-Verzeichnis und die Eingabeebene nicht in derselben Pfadperspektive befinden, ist die handschriftliche Konfiguration fehleranfälliger. In diesem Szenario empfiehlt es sich normalerweise, Folgendes auszuführen:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Nehmen Sie dann Anpassungen basierend auf den generierten Ergebnissen vor.

Wenn Sie sich zunächst von der CLI beim Durchlaufen der Pfade und Routen unterstützen lassen möchten, sieht die generierte Struktur normalerweise wie folgt aus:

```text
NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html
NB_CLI_ROOT/test2/storage/dist-client
NB_CLI_ROOT/test2/storage/uploads
```

In:

- `nocobase.caddy` ist für die Vereinheitlichung von `import */app.caddy` verantwortlich
- `test2/app.caddy` ist die vollständige Site-Konfiguration dieser Umgebung `test2`
- `public/index-v1.html` und `public/index-v2.html` sind CLI-generierte SPA-Fallback-Seiten

Ein umsichtigerer Ansatz ist normalerweise:

1. Lassen Sie zunächst das CLI die Caddy-Konfiguration generieren
2. Bestätigen Sie die Routing-Struktur und den tatsächlichen Pfad basierend auf den generierten Ergebnissen.
3. Nehmen Sie dann manuelle Anpassungen entsprechend Ihrem Domainnamen, Ausführungsmodus und Bereitstellungspfad vor.

Dabei ist es normalerweise weniger wahrscheinlich, dass Details zu WebSockets, statischen Ressourcen, Upload-Verzeichnissen, `.well-known`-Routen oder SPA-Fallback-Seiten übersehen werden, als wenn Sie eine Konfiguration von Grund auf neu schreiben.

## Konfiguration prüfen und neu laden

Wenn Sie die Caddy-Konfiguration schreiben oder manuell anpassen, überprüfen Sie sie zunächst, nachdem Sie die Änderungen vorgenommen haben, und laden Sie sie dann neu:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Wenn Sie `systemd` nicht zum Verwalten von Caddy verwenden, können Sie stattdessen Ihre eigenen Start- und Neulademethoden verwenden.

Wenn Sie die Eingangsebene über `nb proxy caddy` verwalten, wird normalerweise die Verwendung von Folgendem bevorzugt:

```bash
nb proxy caddy reload
```

Wenn Sie den aktuellen Treiber, den gesamten Eintragsdateipfad, das Laufzeitstammverzeichnis und den Container oder lokale Binärinformationen sehen möchten, können Sie Folgendes ausführen:

```bash
nb proxy caddy info
```

Wenn Sie nur schnell überprüfen möchten, ob es ausgeführt wird, können Sie Folgendes ausführen:

```bash
nb proxy caddy status
```

## Allgemeine Anweisungen

- `nb proxy caddy generate` ist für Anwendungen, die von `nb init` installiert wurden
- Wenn Sie bereits einen Domänennamen haben, der normal auf dem Server aufgelöst werden kann, ist Caddy oft der schnellste Weg, um HTTPS zu erhalten.
- Wenn Sie später Konfigurationen wie `app-port` und `app-public-path` ändern, die sich auf die Proxy-Ergebnisse auswirken, denken Sie daran, `generate` erneut auszuführen.

## Verwandte Links

- [Reverse-Proxy der Produktionsumgebung](./index.md)
- [Nginx](./nginx.md)
- [Mit CLI installieren (empfohlen)](../../installation/cli.md)
- [Anwendungskonfiguration mit `.env`](../../installation/env.md)
- [`nb proxy caddy` Befehlsreferenz](../../../api/cli/proxy/caddy/index.md)
