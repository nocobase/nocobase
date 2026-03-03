---
pkg: '@nocobase/plugin-app-supervisor'
---

# Fler-miljöläge

## Introduktion

Använd läget vid högre krav på stabilitet, isolering och skalning.

## Distribution

- Supervisor: central control plane
- Worker: runtime environment
- Redis: config cache and command channel

### Arkitekturberoenden

- Redis
- Database service for Supervisor and Workers

### Ingångsapplikation (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### Worker-applikation (Worker)

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

## Användarguide

### Miljölista

![](https://static-docs.nocobase.com/202512291830371.png)

### Skapa applikation

![](https://static-docs.nocobase.com/202512291835086.png)

### Applikationslista

![](https://static-docs.nocobase.com/202512291842216.png)

### Starta applikation

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxyåtkomst

Use `/apps/:appName/admin` via Supervisor.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
