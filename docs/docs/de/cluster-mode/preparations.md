:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Vorbereitungen

Bevor Sie eine Anwendung im Cluster-Modus bereitstellen, sind einige Vorbereitungen erforderlich.

## Kommerzielle Plugin-Lizenzen

Für den Betrieb einer NocoBase-Anwendung im Cluster-Modus benötigen Sie die Unterstützung der folgenden Plugins:

| Funktion                     | Plugin                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| Cache-Adapter                | Integriert                                                                          |
| Synchronisationssignal-Adapter | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Nachrichtenwarteschlangen-Adapter | `@nocobase/plugin-queue-adapter-redis` oder `@nocobase/plugin-queue-adapter-rabbitmq` |
| Verteilter Sperr-Adapter     | `@nocobase/plugin-lock-adapter-redis`                                               |
| Worker-ID-Zuweiser           | `@nocobase/plugin-workerid-allocator-redis`                                         |

Stellen Sie zunächst sicher, dass Sie die Lizenzen für die oben genannten Plugins erworben haben. (Sie können die entsprechenden Plugin-Lizenzen über die Plattform für kommerzielle Plugin-Dienste erwerben.)

## Systemkomponenten

Neben der Anwendungsinstanz selbst können weitere Systemkomponenten je nach den betrieblichen Anforderungen Ihres Teams vom Betriebspersonal ausgewählt werden.

### Datenbank

Da der aktuelle Cluster-Modus nur auf Anwendungsinstanzen abzielt, unterstützt die Datenbank vorübergehend nur einen einzelnen Knoten. Falls Sie eine Datenbankarchitektur wie Master-Slave verwenden, müssen Sie diese selbst über Middleware implementieren und sicherstellen, dass sie für die NocoBase-Anwendung transparent ist.

### Middleware

Der Cluster-Modus von NocoBase benötigt bestimmte Middleware, um die Kommunikation und Koordination zwischen den Clustern zu ermöglichen. Dazu gehören:

- **Cache**: Verwendet eine Redis-basierte verteilte Cache-Middleware, um die Datenzugriffsgeschwindigkeit zu erhöhen.
- **Synchronisationssignal**: Nutzt die Stream-Funktion von Redis, um die Übertragung von Synchronisationssignalen zwischen Clustern zu realisieren.
- **Nachrichtenwarteschlange**: Verwendet eine Redis- oder RabbitMQ-basierte Nachrichtenwarteschlangen-Middleware für die asynchrone Nachrichtenverarbeitung.
- **Verteilte Sperre**: Setzt eine Redis-basierte verteilte Sperre ein, um den sicheren Zugriff auf gemeinsam genutzte Ressourcen im Cluster zu gewährleisten.

Wenn alle Middleware-Komponenten Redis verwenden, können Sie einen einzelnen Redis-Dienst im internen Netzwerk des Clusters (oder in Kubernetes) starten. Alternativ können Sie für jede Funktion (Cache, Synchronisationssignal, Nachrichtenwarteschlange und verteilte Sperre) einen separaten Redis-Dienst aktivieren.

**Versionshinweise**

- Redis: >=8.0 oder eine `redis-stack`-Version, die die Bloom Filter-Funktion enthält.
- RabbitMQ: >=4.0

### Gemeinsamer Speicher

NocoBase benötigt das `storage`-Verzeichnis, um systemrelevante Dateien zu speichern. Im Multi-Node-Modus sollten Sie eine Cloud-Festplatte (oder NFS) mounten, um den gemeinsamen Zugriff über mehrere Knoten hinweg zu ermöglichen. Andernfalls wird der lokale Speicher nicht automatisch synchronisiert und kann nicht ordnungsgemäß funktionieren.

Bei der Bereitstellung mit Kubernetes beachten Sie bitte den Abschnitt [Kubernetes-Bereitstellung: Gemeinsamer Speicher](./kubernetes#shared-storage).

### Lastverteilung

Der Cluster-Modus erfordert einen Lastverteiler (Load Balancer), um Anfragen zu verteilen sowie die Integrität der Anwendungsinstanzen zu prüfen und bei Ausfällen zu übernehmen. Dieser Teil sollte entsprechend den betrieblichen Anforderungen Ihres Teams ausgewählt und konfiguriert werden.

Am Beispiel eines selbst gehosteten Nginx fügen Sie den Konfigurationsdateien den folgenden Inhalt hinzu:

```
upstream myapp {
    # ip_hash; # Kann für die Session-Persistenz verwendet werden. Wenn aktiviert, werden Anfragen desselben Clients immer an denselben Backend-Server gesendet.
    server 172.31.0.1:13000; # Interner Knoten 1
    server 172.31.0.2:13000; # Interner Knoten 2
    server 172.31.0.3:13000; # Interner Knoten 3
}

server {
    listen 80;

    location / {
        # Verwendet das definierte Upstream für die Lastverteilung
        proxy_pass http://myapp;
        # ... weitere Konfigurationen
    }
}
```

Dies bedeutet, dass Anfragen per Reverse-Proxy an verschiedene Serverknoten zur Verarbeitung verteilt werden.

Für Lastverteilungs-Middleware, die von anderen Cloud-Anbietern bereitgestellt wird, beachten Sie bitte die Konfigurationsdokumentation des jeweiligen Anbieters.

## Umgebungsvariablen-Konfiguration

Alle Knoten im Cluster sollten dieselbe Umgebungsvariablen-Konfiguration verwenden. Zusätzlich zu den grundlegenden [Umgebungsvariablen](/api/cli/env) von NocoBase müssen auch die folgenden Middleware-bezogenen Umgebungsvariablen konfiguriert werden.

### Mehrkern-Modus

Wenn die Anwendung auf einem Mehrkern-Knoten läuft, können Sie den Mehrkern-Modus des Knotens aktivieren:

```ini
# PM2 Mehrkern-Modus aktivieren
# CLUSTER_MODE=max # Standardmäßig deaktiviert, muss manuell konfiguriert werden
```

Wenn Sie Anwendungs-Pods in Kubernetes bereitstellen, können Sie diese Konfiguration ignorieren und die Anzahl der Anwendungsinstanzen über die Anzahl der Pod-Replikate steuern.

### Cache

```ini
# Cache-Adapter, muss im Cluster-Modus auf redis gesetzt werden (standardmäßig In-Memory, wenn nicht angegeben)
CACHE_DEFAULT_STORE=redis

# Verbindungs-URL des Redis Cache-Adapters, muss ausgefüllt werden
CACHE_REDIS_URL=
```

### Synchronisationssignal

```ini
# Verbindungs-URL des Redis Synchronisations-Adapters, standardmäßig redis://localhost:6379/0, wenn nicht angegeben
PUBSUB_ADAPTER_REDIS_URL=
```

### Verteilte Sperre

```ini
# Sperr-Adapter, muss im Cluster-Modus auf redis gesetzt werden (standardmäßig In-Memory lokale Sperre, wenn nicht angegeben)
LOCK_ADAPTER_DEFAULT=redis

# Verbindungs-URL des Redis Sperr-Adapters, standardmäßig redis://localhost:6379/0, wenn nicht angegeben
LOCK_ADAPTER_REDIS_URL=
```

### Nachrichtenwarteschlange

```ini
# Redis als Nachrichtenwarteschlangen-Adapter aktivieren, standardmäßig In-Memory-Adapter, wenn nicht angegeben
QUEUE_ADAPTER=redis
# Verbindungs-URL des Redis Nachrichtenwarteschlangen-Adapters, standardmäßig redis://localhost:6379/0, wenn nicht angegeben
QUEUE_ADAPTER_REDIS_URL=
```

### Worker-ID-Zuweiser

Einige System-Sammlungen in NocoBase verwenden global eindeutige IDs als Primärschlüssel. Um Primärschlüsselkonflikte in einem Cluster zu vermeiden, muss jede Anwendungsinstanz über den Worker-ID-Zuweiser eine eindeutige Worker-ID erhalten. Der aktuelle Worker-ID-Bereich liegt zwischen 0 und 31, was bedeutet, dass jede Anwendung maximal 32 Knoten gleichzeitig betreiben kann. Details zum Design der global eindeutigen ID finden Sie unter [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id).

```ini
# Redis-Verbindungs-URL für den Worker-ID-Zuweiser.
# Wenn weggelassen, wird eine zufällige Worker-ID zugewiesen.
REDIS_URL=
```

:::info{title=Tipp}
Normalerweise können alle zugehörigen Adapter dieselbe Redis-Instanz verwenden. Es ist jedoch ratsam, unterschiedliche Datenbanken zu nutzen, um mögliche Schlüsselkonflikte zu vermeiden, zum Beispiel:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Derzeit verwendet jedes Plugin seine eigenen Redis-bezogenen Umgebungsvariablen. Zukünftig könnte `REDIS_URL` als Fallback-Konfiguration verwendet werden.

:::

Wenn Sie Kubernetes zur Verwaltung des Clusters verwenden, können Sie die oben genannten Umgebungsvariablen in einer ConfigMap oder einem Secret konfigurieren. Weitere Informationen finden Sie unter [Kubernetes-Bereitstellung](./kubernetes).

Nachdem alle oben genannten Vorbereitungen abgeschlossen sind, können Sie mit den [Betriebsabläufen](./operations) fortfahren, um die Anwendungsinstanzen zu verwalten.