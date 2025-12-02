:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Bereitstellung in der Produktionsumgebung

Wenn Sie NocoBase in einer Produktionsumgebung bereitstellen, kann die Installation von Abhängigkeiten aufwendig sein, da die Build-Methoden in verschiedenen Systemen und Umgebungen variieren. Für ein vollständiges Funktionserlebnis empfehlen wir die Bereitstellung mit **Docker**. Wenn Ihre Systemumgebung Docker nicht verwenden kann, können Sie auch **create-nocobase-app** für die Bereitstellung nutzen.

:::warning

Es wird nicht empfohlen, NocoBase direkt aus dem Quellcode in einer Produktionsumgebung bereitzustellen. Der Quellcode hat viele Abhängigkeiten, ist umfangreich und eine vollständige Kompilierung stellt hohe Anforderungen an CPU und Arbeitsspeicher. Wenn Sie unbedingt aus dem Quellcode bereitstellen müssen, wird empfohlen, zuerst ein benutzerdefiniertes Docker-Image zu erstellen und es dann bereitzustellen.

:::

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