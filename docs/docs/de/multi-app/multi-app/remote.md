---
pkg: '@nocobase/plugin-app-supervisor'
---

# Multi-Umgebungsmodus

## Einführung

Der Shared-Memory-Multi-App-Modus bietet klare Vorteile bei Deployment und Betrieb. Mit steigender App-Anzahl und wachsender Business-Komplexität kann jedoch eine einzelne Instanz an Grenzen stoßen. Für diese Szenarien eignet sich ein hybrides Multi-Umgebungs-Deployment.

In diesem Modus wird eine **Einstiegsanwendung** als zentrale Verwaltung und Steuerung bereitgestellt sowie mehrere **NocoBase-Instanzen** als unabhängige Laufzeitumgebungen für die Business-Apps. Die Umgebungen sind isoliert und arbeiten koordiniert zusammen.

Auf Deployment-Ebene können Umgebungen als separate Prozesse, Docker-Container oder mehrere Kubernetes-Deployments betrieben werden.

## Deployment

Im Multi-Umgebungsmodus gilt:

- Die **Einstiegsanwendung (Supervisor)** verwaltet Apps und Umgebungen zentral
- **Worker-Anwendungen (Worker)** fungieren als tatsächliche Laufzeitumgebungen
- App- und Umgebungskonfigurationen werden in Redis zwischengespeichert
- Befehle und Statussynchronisation zwischen Supervisor und Workern laufen über Redis

Die Erstellung von Umgebungen ist aktuell noch nicht integriert. Worker müssen manuell bereitgestellt und konfiguriert werden.

### Architekturabhängigkeiten

Vor dem Deployment:

- **Redis**
  - Cache für App- und Umgebungskonfigurationen
  - Kommunikationskanal für Befehle zwischen Supervisor und Workern

- **Datenbank**
  - Datenbankdienste für Supervisor und Worker

### Einstiegsanwendung (Supervisor)

Die Einstiegsanwendung ist die zentrale Steuerungsebene für App-Erstellung, Start/Stopp, Umgebungsscheduling und Zugriffsproxy.

Umgebungsvariablen des Supervisors:

```bash
# Application mode
APP_MODE=supervisor
# Application discovery adapter
APP_DISCOVERY_ADAPTER=remote
# Application process adapter
APP_PROCESS_ADAPTER=remote
# Redis for application and environment configuration cache
APP_SUPERVISOR_REDIS_URL=
# Command communication adapter
APP_COMMAND_ADPATER=redis
# Redis for command communication
APP_COMMAND_REDIS_URL=
```

### Worker-Anwendung (Worker)

Worker hosten und betreiben die konkreten NocoBase-App-Instanzen.

Umgebungsvariablen des Workers:

```bash
# Application mode
APP_MODE=worker
# Application discovery adapter
APP_DISCOVERY_ADAPTER=remote
# Application process adapter
APP_PROCESS_ADAPTER=local
# Redis for application and environment configuration cache
APP_SUPERVISOR_REDIS_URL=
# Command communication adapter
APP_COMMAND_ADPATER=redis
# Redis for command communication
APP_COMMAND_REDIS_URL=
# Environment identifier
ENVIRONMENT_NAME=
# Environment access URL
ENVIRONMENT_URL=
# Environment proxy access URL
ENVIRONMENT_PROXY_URL=
```

### Docker-Compose-Beispiel

Das folgende Beispiel zeigt ein hybrides Multi-Umgebungs-Deployment mit einem Supervisor und zwei Workern.

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

Die grundlegende App-Verwaltung entspricht dem Shared-Memory-Modus, siehe [Shared-Memory-Modus](./local.md). Hier werden die Multi-Umgebungsaspekte beschrieben.

### Umgebungsliste

Nach dem Deployment können Sie auf der Seite **App supervisor** im Tab **Environment** die registrierten Worker-Umgebungen einsehen: Kennung, Version, URL und Status. Worker senden alle 2 Minuten einen Heartbeat.

![](https://static-docs.nocobase.com/202512291830371.png)

### App erstellen

Beim Erstellen einer App können Sie eine oder mehrere Laufzeitumgebungen auswählen. In den meisten Fällen reicht eine Umgebung. Mehrere Umgebungen sind sinnvoll bei [Service Splitting](/cluster-mode/services-splitting).

![](https://static-docs.nocobase.com/202512291835086.png)

### App-Liste

Die App-Liste zeigt die aktuelle Laufzeitumgebung und den Status je App. Bei mehreren Umgebungen werden mehrere Status angezeigt. Start/Stop sollte dann zentral gesteuert werden.

![](https://static-docs.nocobase.com/202512291842216.png)

### App-Start

Da beim Start Initialdaten in die Datenbank geschrieben werden können, werden Starts bei Multi-Umgebungs-Deployments zur Vermeidung von Race Conditions in eine Warteschlange gestellt.

![](https://static-docs.nocobase.com/202512291841727.png)

### Zugriffsproxy

Worker-Apps können über den Subpfad `/apps/:appName/admin` der Einstiegsanwendung aufgerufen werden.

![](https://static-docs.nocobase.com/202601082154230.png)

Wenn eine App in mehreren Umgebungen bereitgestellt ist, muss ein Ziel für den Proxyzugriff gewählt werden.

![](https://static-docs.nocobase.com/202601082155146.png)

Standardmäßig verwendet der Proxy `ENVIRONMENT_URL`. Dieser muss aus dem Netzwerk der Einstiegsanwendung erreichbar sein. Alternativ kann `ENVIRONMENT_PROXY_URL` gesetzt werden.
