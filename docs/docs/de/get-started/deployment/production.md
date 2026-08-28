# Bereitstellung in der Produktionsumgebung

Wenn Sie NocoBase in einer Produktionsumgebung bereitstellen, kann die Installation von Abhängigkeiten aufwendig sein, da die Build-Methoden in verschiedenen Systemen und Umgebungen variieren. Für ein vollständiges Funktionserlebnis empfehlen wir die Bereitstellung mit **Docker**. Wenn Ihre Systemumgebung Docker nicht verwenden kann, können Sie auch **create-nocobase-app** für die Bereitstellung nutzen.

:::warning Hinweis

Es wird nicht empfohlen, NocoBase direkt aus dem Quellcode in einer Produktionsumgebung bereitzustellen. Der Quellcode hat viele Abhängigkeiten, ist umfangreich und eine vollständige Kompilierung stellt hohe Anforderungen an CPU und Arbeitsspeicher. Wenn Sie unbedingt aus dem Quellcode bereitstellen müssen, wird empfohlen, zuerst ein benutzerdefiniertes Docker-Image zu erstellen und es dann bereitzustellen.

:::

:::warning Hinweis

Wenn Sie mehrere voneinander unabhängige NocoBase-Dienste bereitstellen, verwenden Sie für jeden Dienst einen eigenen `hostname`, etwa unterschiedliche Subdomains. Unterscheiden Sie die Dienste nicht nur über Ports wie `https://example.com:13000` und `https://example.com:14000`.

NocoBase verwendet Cookies für den Anmeldestatus und die [Dateizugriffsrechte](../../file-manager/stable-url.md). Browser trennen Cookies nicht nach Port. Dienste auf verschiedenen Ports unter demselben `hostname` können daher gleichnamige Cookies gemeinsam verwenden, wodurch Anmeldestatus überschrieben oder die Autorisierung von Dateivorschau und Download beeinträchtigt werden kann.

Unteranwendungen innerhalb derselben NocoBase-Bereitstellung fallen nicht unter diese Einschränkung. Anmelde-Cookies werden anhand des Anwendungsnamens unterschieden, sodass die Hauptanwendung und unterschiedlich benannte Unteranwendungen denselben `hostname` verwenden können.

Unabhängige Dienste müssen dennoch isoliert werden. Wenn ein weiterer NocoBase-Dienst auf einem anderen Port unter demselben `hostname` läuft und eine gleichnamige Haupt- oder Unteranwendung enthält, können die Cookies weiterhin kollidieren.

Verwenden Sie beispielsweise `app1.example.com` und `app2.example.com` und leiten Sie diese über Nginx oder Caddy an die jeweiligen NocoBase-Dienste weiter.

:::

## Getrenntes Frontend / Ursprungsübergreifender API-Zugriff

Es ist empfehlenswert, Seiten und API auf demselben Origin zu halten: Verwenden Sie einen Reverse-Proxy unter derselben Domain, der `${APP_PUBLIC_PATH}api/` und `${APP_PUBLIC_PATH}files/` an den NocoBase-Dienst weiterleitet, und lassen Sie `API_BASE_URL` leer.

Wenn die Seiten die API ursprungsübergreifend aufrufen müssen (`API_BASE_URL` zeigt auf einen anderen Origin), fügen Sie den Ursprung der Seiten zu `CORS_ORIGIN_WHITELIST` hinzu. Andernfalls ignoriert der Browser `Set-Cookie` in API-Antworten, das Anmelde-Cookie wird nicht gespeichert und Vorschau sowie Download über stabile Datei-URLs schlagen bei der Autorisierung fehl.

Beachten Sie außerdem, dass Cookies pro `hostname` gespeichert werden: Wenn Seiten und API vollständig unterschiedliche Domains verwenden, enthalten Aufrufe von `/files/` über die Seitendomain nicht das Anmelde-Cookie, das unter der API-Domain gespeichert wurde. Solche Bereitstellungen sollten auf einen Same-Origin-Reverse-Proxy umgestellt werden. Siehe [Umgebungsvariablen](../installation/env.md#api_base_url).

## Bereitstellungsprozess

Für die Bereitstellung in der Produktionsumgebung können Sie sich an den vorhandenen Installations- und Upgrade-Schritten orientieren.

### Neuinstallation

- [Docker-Installation](../installation/docker.mdx)
- [create-nocobase-app-Installation](../installation/create-nocobase-app.mdx)

### Aktualisierung der Anwendung

- [Aktualisierung einer Docker-Installation](../installation/docker.mdx)
- [Aktualisierung einer create-nocobase-app-Installation](../installation/create-nocobase-app.mdx)

### Installation und Aktualisierung von Drittanbieter-Plugins

- [Installation und Aktualisierung von Plugins](../install-upgrade-plugins.mdx)

## Proxy für statische Ressourcen

In einer Produktionsumgebung wird empfohlen, statische Ressourcen von einem Proxy-Server verwalten zu lassen, zum Beispiel:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Häufig verwendete Betriebs-Befehle

Je nach Installationsmethode können Sie die folgenden Befehle verwenden, um den NocoBase-Prozess zu verwalten:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)
