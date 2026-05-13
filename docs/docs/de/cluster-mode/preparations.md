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

Neben den Anwendungsinstanzen selbst erfordert eine Cluster-Bereitstellung auch Systemkomponenten wie Datenbank, Middleware, gemeinsamen Speicher und Lastverteilung. Unterschiedliche Teams können die konkrete Implementierung dieser Komponenten entsprechend ihrem eigenen Betriebsmodell auswählen.

### Datenbank

Da der aktuelle Cluster-Modus nur auf Anwendungsinstanzen abzielt, unterstützt die Datenbank vorübergehend nur einen einzelnen Knoten. Falls Sie eine Datenbankarchitektur wie Master-Slave verwenden, müssen Sie diese selbst über Middleware implementieren und sicherstellen, dass sie für die NocoBase-Anwendung transparent ist.

Wenn Sie Warm-Standby oder Disaster Recovery über Verfügbarkeitszonen oder Regionen hinweg benötigen, müssen Datenbanksynchronisation und Umschaltstrategie vom Betriebsteam selbst entworfen und umgesetzt werden.

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

NocoBase verwendet das Verzeichnis `storage`, um systemrelevante Dateien zu speichern. Gemeinsamer Speicher ist außerdem ein notwendiger Bestandteil einer Cluster-Bereitstellung. Im Multi-Node-Modus können Sie je nach Infrastruktur unterschiedliche Implementierungen wie Cloud-Datenträger, NFS oder EFS wählen, um den gemeinsamen Zugriff mehrerer Knoten zu ermöglichen. Andernfalls werden Systemdateien nicht automatisch synchronisiert und die Anwendung kann nicht ordnungsgemäß funktionieren.

Bei der Bereitstellung mit Kubernetes beachten Sie bitte den Abschnitt [Kubernetes-Bereitstellung: Gemeinsamer Speicher](./kubernetes#shared-storage).

#### Was wird typischerweise im Verzeichnis `storage` gespeichert?

Der Inhalt des Verzeichnisses `storage` variiert je nach aktivierten Plugins und Bereitstellungsart. Nach aktuellem Implementierungsstand gehören typischerweise dazu:

| Pfad | Zweck | Nutzungsempfehlung |
| --- | --- | --- |
| `storage/uploads` | Hochgeladene Dateien im lokalen Speichermodus | In Produktionsclustern sollten vorrangig Objektspeicher wie S3 / OSS / COS verwendet werden |
| `storage/plugins` | Zur Laufzeit installierte, hochgeladene oder erkannte lokale Plugin-Pakete | Wenn lokale Plugins verwendet werden, muss dieses Verzeichnis gemeinsam genutzt werden; sind Plugins bereits im Image enthalten, lässt sich diese Abhängigkeit verringern |
| `storage/apps/<app>/jwt_secret.dat` | Standard-Token-Schlüssel, der automatisch generiert wird, wenn `APP_KEY` nicht explizit konfiguriert ist | In Produktion nicht auf diese Datei verlassen; stattdessen `APP_KEY` explizit konfigurieren |
| `storage/apps/<app>/aes_key.dat` | Standard-AES-Schlüssel, der automatisch generiert wird, wenn `APP_AES_SECRET_KEY` nicht explizit konfiguriert ist | In Produktion nicht auf diese Datei verlassen; stattdessen `APP_AES_SECRET_KEY` explizit konfigurieren |
| `storage/environment-variables/<app>/aes_key.dat` | AES-Schlüsseldatei für Szenarien mit dem Umgebungsvariablen-Plugin | Es wird empfohlen, eine schreibgeschützt eingebundene Schlüsseldatei zu verwenden |
| `storage/logs` | Standard-Logverzeichnis sowie einige Migrationsprotokolle | Perspektivisch wird die Anbindung an eine externe Logging-Plattform empfohlen |
| `storage/tmp` | Temporäre Dateien für Import, Export, Migration usw. | Kann temporär sein; wenn eine Wiederverwendung über mehrere Knoten hinweg nötig ist, muss es gemeinsam genutzt werden oder die Operation auf einen einzelnen Verwaltungs-Knoten beschränkt werden |
| `storage/backups`, `storage/duplicator`, `storage/migration-manager` | Artefakte für Backup, Wiederherstellung und Migration | Diese sollten als Betriebsverzeichnisse betrachtet, persistent gespeichert und nicht gleichzeitig von mehreren Knoten verändert werden |

Die obige Tabelle ist nicht vollständig, verdeutlicht jedoch einen wichtigen Punkt: `storage` enthält Geschäftsdaten-Dateien, Schlüsseldateien, Plugin-Verzeichnisse, Logs und betriebsbezogene temporäre Artefakte zugleich. Daher ist die übliche Grundlage für Cluster-Bereitstellungen, das gesamte Verzeichnis `/app/nocobase/storage` gemeinsam und persistent bereitzustellen.

#### Speicherbezogene Empfehlungen

Die Cluster-Konsistenz in NocoBase stützt sich primär auf Datenbank, Redis, Nachrichtenwarteschlangen und verteilte Sperren und nicht darauf, ein gemeinsames Dateisystem als Koordinationsmedium mit hoher Parallelität zu verwenden.

Daher wird empfohlen:

- Für hochfrequent genutzte Geschäftsdaten-Dateien wie Anhänge vorrangig Objektspeicher zu verwenden. Von einer langfristigen Nutzung lokalen Speichers in Produktionsclustern wird abgeraten.
- Gemeinsamer Speicher sollte hauptsächlich das Verzeichnis `storage` tragen und nicht als Dateispeicher mit hohem Durchsatz dienen.
- Vorgänge wie Plugin-Installation, Plugin-Upgrade, Backup, Wiederherstellung und Migration sollten erst nach dem Herunterskalieren des Clusters auf einen einzelnen Knoten durchgeführt werden; anschließend kann der Cluster wieder hochskaliert werden.

### Lastverteilung

Der Cluster-Modus erfordert einen Lastverteiler (Load Balancer), um Anfragen zu verteilen sowie die Integrität der Anwendungsinstanzen zu prüfen und bei Ausfällen zu übernehmen. Dieser Teil sollte entsprechend den betrieblichen Anforderungen Ihres Teams ausgewählt und konfiguriert werden.

Am Beispiel eines selbst gehosteten Nginx fügen Sie den Konfigurationsdateien den folgenden Inhalt hinzu:

```
upstream myapp {
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

Für Hochverfügbarkeits-Bereitstellungen wird empfohlen:

- Innerhalb desselben Clusters mindestens 2 Anwendungsinstanzen zu betreiben und das Failover einzelner Instanzen dem Load Balancer zu überlassen.
- Die Gesundheitsprüfung des Load Balancers sollte die tatsächliche Verfügbarkeit der Anwendung abbilden und nicht nur prüfen, ob der Port erreichbar ist.
- Wenn Warm-Standby über Verfügbarkeitszonen oder Regionen hinweg erforderlich ist, sollten in der Regel mehrere unabhängige Cluster bereitgestellt werden. Die Synchronisation und Umschaltung von Datenbank, gemeinsamem Speicher und anderer Infrastruktur liegt dann beim Betriebsteam.

## Umgebungsvariablen-Konfiguration

Alle Knoten im Cluster sollten dieselbe Umgebungsvariablen-Konfiguration verwenden. Zusätzlich zu den grundlegenden [Umgebungsvariablen](/api/cli/env) von NocoBase müssen auch die folgenden Middleware-bezogenen Umgebungsvariablen konfiguriert werden.

### Wichtige Schlüssel

Zusätzlich zu den Middleware-Umgebungsvariablen sollten auf allen Knoten im Cluster dieselben wichtigen Schlüssel explizit konfiguriert werden:

```ini
APP_KEY=
APP_AES_SECRET_KEY=
# Oder eine schreibgeschützt eingebundene Schlüsseldatei verwenden
# APP_AES_SECRET_KEY_PATH=
```

- `APP_KEY` wird für die Signierung von Token / JWT verwendet. Wenn er nicht explizit konfiguriert ist, greift die Anwendung auf die Standard-Schlüsseldatei unter `storage` zurück.
- `APP_AES_SECRET_KEY` wird verwendet, um sensible Felder in der Datenbank zu entschlüsseln. Wenn er nicht explizit konfiguriert ist, greift die Anwendung ebenfalls auf die Standard-Schlüsseldatei unter `storage` zurück.
- In flüchtigen Containern oder Multi-Node-Bereitstellungen kann die Abhängigkeit von automatisch generierten lokalen Schlüsseldateien dazu führen, dass Tokens nach einem Neustart ungültig werden oder historische verschlüsselte Daten nicht mehr entschlüsselt werden können.

:::info{title=Tipp}
`APP_AES_SECRET_KEY` muss ein 32-Byte-AES-256-Schlüssel sein, dargestellt durch 64 hexadezimale Zeichen.

In Cloud-Umgebungen wird empfohlen, diese Werte zentral über Dienste wie Secrets Manager, SSM Parameter Store, Kubernetes Secret oder eine schreibgeschützt eingebundene Schlüsseldatei zu verwalten.
:::

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
