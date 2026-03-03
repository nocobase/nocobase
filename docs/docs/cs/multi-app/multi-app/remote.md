---
pkg: '@nocobase/plugin-app-supervisor'
---

# Režim více prostředí

## Úvod

Použijte tento režim při vyšších nárocích na stabilitu, izolaci a škálování.

## Nasazení

- Supervisor: central control plane
- Worker: runtime environment
- Redis: config cache and command channel

### Architektonické závislosti

- Redis
- Database service for Supervisor and Workers

### Vstupní aplikace (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### Worker aplikace (Worker)

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

## Uživatelská příručka

### Seznam prostředí

![](https://static-docs.nocobase.com/202512291830371.png)

### Vytvoření aplikace

![](https://static-docs.nocobase.com/202512291835086.png)

### Seznam aplikací

![](https://static-docs.nocobase.com/202512291842216.png)

### Spuštění aplikace

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxy přístup

Use `/apps/:appName/admin` via Supervisor.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
