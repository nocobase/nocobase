---
pkg: '@nocobase/plugin-app-supervisor'
---

# Multi-omgevingsmodus

## Introductie

Gebruik deze modus wanneer hogere stabiliteit, isolatie en schaal nodig zijn.

## Implementatie

- Supervisor: central control plane
- Worker: runtime environment
- Redis: config cache and command channel

### Architectuurafhankelijkheden

- Redis
- Database service for Supervisor and Workers

### Entry-applicatie (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### Worker-applicatie (Worker)

```bash
APP_MODE=worker
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=local
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
ENVIRONMENT_NAME=
ENVIRONMENT_URL=
ENVIRONMENT_PROXY_URL=
```

## Gebruikershandleiding

### Omgevingslijst

![](https://static-docs.nocobase.com/202512291830371.png)

### Applicatie maken

![](https://static-docs.nocobase.com/202512291835086.png)

### Applicatielijst

![](https://static-docs.nocobase.com/202512291842216.png)

### Applicatie starten

![](https://static-docs.nocobase.com/202512291841727.png)

### Toegangsproxy

Use `/apps/:appName/admin` via Supervisor.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
