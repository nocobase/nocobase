---
pkg: '@nocobase/plugin-app-supervisor'
---

# Tryb wielu środowisk

## Wprowadzenie

Wybierz ten tryb przy większych wymaganiach dot. stabilności, izolacji i skalowania.

## Wdrożenie

- Supervisor: central control plane
- Worker: runtime environment
- Redis: config cache and command channel

### Zależności architektury

- Redis
- Database service for Supervisor and Workers

### Aplikacja wejściowa (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### Aplikacja robocza (Worker)

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

## Podręcznik użytkownika

### Lista środowisk

![](https://static-docs.nocobase.com/202512291830371.png)

### Tworzenie aplikacji

![](https://static-docs.nocobase.com/202512291835086.png)

### Lista aplikacji

![](https://static-docs.nocobase.com/202512291842216.png)

### Uruchamianie aplikacji

![](https://static-docs.nocobase.com/202512291841727.png)

### Dostęp przez proxy

Use `/apps/:appName/admin` via Supervisor.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
