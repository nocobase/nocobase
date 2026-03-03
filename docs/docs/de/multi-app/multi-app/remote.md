---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/multi-app/multi-app/remote).
:::

# Multi-Umgebungsmodus

## Einführung

Der Multi-Anwendungsmodus mit gemeinsam genutztem Speicher bietet deutliche Vorteile bei der Bereitstellung und Wartung. Mit zunehmender Anzahl von Anwendungen und steigender Geschäftskomplexität kann eine einzelne Instanz jedoch allmählich mit Problemen wie Ressourcenkonflikten und sinkender Stabilität konfrontiert werden. Für solche Szenarien können Benutzer eine hybride Multi-Umgebungs-Bereitstellungslösung verwenden, um komplexere Geschäftsanforderungen zu unterstützen.

In diesem Modus stellt das System eine Einstiegsanwendung als einheitliches Verwaltungs- und Planungszentrum bereit und setzt gleichzeitig mehrere NocoBase-Instanzen als unabhängige Anwendungslaufzeitumgebungen ein, die für die tatsächliche Ausführung der Geschäftsanwendungen verantwortlich sind. Die einzelnen Umgebungen sind voneinander isoliert und arbeiten koordiniert zusammen, wodurch der Druck auf eine einzelne Instanz effektiv verteilt und die Stabilität, Erweiterbarkeit sowie die Fehlerisolationsfähigkeit des Systems erheblich verbessert werden.

Auf der Bereitstellungsebene können verschiedene Umgebungen entweder in unabhängigen Prozessen ausgeführt, als verschiedene Docker-Container bereitgestellt oder in Form von mehreren Kubernetes-Deployments existieren. Dies ermöglicht eine flexible Anpassung an Infrastrukturumgebungen unterschiedlicher Größe und Architektur.

## Bereitstellung

Im hybriden Multi-Umgebungs-Bereitstellungsmodus:

- Die Einstiegsanwendung (Supervisor) ist für die einheitliche Verwaltung von Anwendungs- und Umgebungsinformationen verantwortlich.
- Die Arbeitsanwendungen (Worker) dienen als tatsächliche Geschäftslaufzeitumgebungen.
- Anwendungs- und Umgebungskonfigurationen werden über einen Redis-Cache zwischengespeichert.
- Die Synchronisation von Befehlen und Status zwischen der Einstiegsanwendung und den Arbeitsanwendungen erfolgt über Redis-Kommunikation.

Derzeit wird noch keine Funktion zur Erstellung von Umgebungen bereitgestellt. Jede Arbeitsanwendung muss manuell bereitgestellt und mit den entsprechenden Umgebungsinformationen konfiguriert werden, bevor sie von der Einstiegsanwendung erkannt werden kann.

### Architekturabhängigkeiten

Bitte bereiten Sie vor der Bereitstellung die folgenden Dienste vor:

- Redis
  - Zwischenspeichern von Anwendungs- und Umgebungskonfigurationen.
  - Dient als Kanal für die Befehlskommunikation zwischen der Einstiegsanwendung und den Arbeitsanwendungen.

- Datenbank
  - Datenbankdienste, mit denen sich die Einstiegsanwendung und die Arbeitsanwendungen verbinden müssen.

### Einstiegsanwendung (Supervisor)

Die Einstiegsanwendung fungiert als einheitliches Verwaltungszentrum und ist für die Erstellung, den Start, den Stopp und die Planung von Umgebungen sowie für den Anwendungszugriffsproxy verantwortlich.

Erläuterung der Umgebungsvariablen für die Einstiegsanwendung:

```bash
# Anwendungsmodus
APP_MODE=supervisor
# Methode zur Anwendungserkennung
APP_DISCOVERY_ADAPTER=remote
# Methode zur Verwaltung von Anwendungsprozessen
APP_PROCESS_ADAPTER=remote
# Redis für den Cache von Anwendungs- und Umgebungskonfigurationen
APP_SUPERVISOR_REDIS_URL=
# Methode für die Befehlskommunikation der Anwendung
APP_COMMAND_ADAPTER=redis
# Redis für die Befehlskommunikation der Anwendung
APP_COMMAND_REDIS_URL=
```

### Arbeitsanwendung (Worker)

Die Arbeitsanwendung dient als tatsächliche Geschäftslaufzeitumgebung und ist für das Hosten und Ausführen spezifischer NocoBase-Anwendungsinstanzen verantwortlich.

Erläuterung der Umgebungsvariablen für die Arbeitsanwendung:

```bash
# Anwendungsmodus
APP_MODE=worker
# Methode zur Anwendungserkennung
APP_DISCOVERY_ADAPTER=remote
# Methode zur Verwaltung von Anwendungsprozessen
APP_PROCESS_ADAPTER=local
# Redis für den Cache von Anwendungs- und Umgebungskonfigurationen
APP_SUPERVISOR_REDIS_URL=
# Methode für die Befehlskommunikation der Anwendung
APP_COMMAND_ADAPTER=redis
# Redis für die Befehlskommunikation der Anwendung
APP_COMMAND_REDIS_URL=
# Umgebungsidentifikator
ENVIRONMENT_NAME=
# URL für den Umgebungszugriff
ENVIRONMENT_URL=
# URL für den Proxy-Zugriff auf die Umgebung
ENVIRONMENT_PROXY_URL=
```

### Docker Compose Beispiel

Das folgende Beispiel zeigt eine hybride Multi-Umgebungs-Bereitstellungslösung mit Docker-Containern als Laufzeiteinheit, bei der eine Einstiegsanwendung und zwei Arbeitsanwendungen gleichzeitig über Docker Compose bereitgestellt werden.

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## Benutzerhandbuch

Die grundlegenden Verwaltungsvorgänge für Anwendungen unterscheiden sich nicht vom Modus mit gemeinsam genutztem Speicher, bitte beziehen Sie sich auf den [Modus mit gemeinsam genutztem Speicher](./local.md). In diesem Abschnitt werden hauptsächlich die Inhalte im Zusammenhang mit der Multi-Umgebungs-Konfiguration vorgestellt.

### Umgebungsliste

Rufen Sie nach Abschluss der Bereitstellung die Seite „Anwendungs-Supervisor“ der Einstiegsanwendung auf. Auf der Registerkarte „Umgebungen“ können Sie die Liste der registrierten Arbeitsumgebungen einsehen. Diese enthält Informationen wie den Umgebungsidentifikator, die Version der Arbeitsanwendung, die Zugriffs-URL und den Status. Arbeitsanwendungen melden alle 2 Minuten einen Herzschlag, um die Verfügbarkeit der Umgebung sicherzustellen.

![](https://static-docs.nocobase.com/202512291830371.png)

### Anwendungserstellung

Beim Erstellen einer Anwendung können Sie eine oder mehrere Laufzeitumgebungen auswählen, um festzulegen, in welchen Arbeitsanwendungen diese Anwendung bereitgestellt werden soll. Im Normalfall wird empfohlen, nur eine Umgebung auszuwählen. Wählen Sie nur dann mehrere Umgebungen aus, wenn eine Arbeitsanwendung eine [Dienstetrennung](/cluster-mode/services-splitting) durchgeführt hat und dieselbe Anwendung in mehreren Laufzeitumgebungen bereitgestellt werden muss, um eine Lastverteilung oder Funktionsisolierung zu erreichen.

![](https://static-docs.nocobase.com/202512291835086.png)

### Anwendungsliste

Die Anwendungslistenseite zeigt die aktuelle Laufzeitumgebung und Statusinformationen für jede Anwendung an. Wenn eine Anwendung in mehreren Umgebungen bereitgestellt ist, werden mehrere Laufzeitstati angezeigt. Dieselbe Anwendung in mehreren Umgebungen behält im Normalfall einen einheitlichen Status bei und erfordert eine einheitliche Steuerung von Start und Stopp.

![](https://static-docs.nocobase.com/202512291842216.png)

### Anwendungsstart

Da beim Starten einer Anwendung möglicherweise Initialisierungsdaten in die Datenbank geschrieben werden, erfolgt der Start von Anwendungen, die in mehreren Umgebungen bereitgestellt sind, nacheinander in einer Warteschlange, um Race Conditions in Multi-Umgebungs-Szenarien zu vermeiden.

![](https://static-docs.nocobase.com/202512291841727.png)

### Anwendungszugriffsproxy

Arbeitsanwendungen können über den Unterpfad `/apps/:appName/admin` der Einstiegsanwendung per Proxy aufgerufen werden.

![](https://static-docs.nocobase.com/202601082154230.png)

Wenn eine Anwendung in mehreren Umgebungen bereitgestellt ist, muss eine Zielumgebung für den Proxy-Zugriff angegeben werden.

![](https://static-docs.nocobase.com/202601082155146.png)

Standardmäßig verwendet die Proxy-Zugriffsadresse die Zugriffsadresse der Arbeitsanwendung, was der Umgebungsvariablen `ENVIRONMENT_URL` entspricht. Es muss sichergestellt werden, dass diese Adresse in der Netzwerkumgebung, in der sich die Einstiegsanwendung befindet, erreichbar ist. Falls eine andere Proxy-Zugriffsadresse verwendet werden soll, kann diese über die Umgebungsvariable `ENVIRONMENT_PROXY_URL` überschrieben werden.