---
pkg: '@nocobase/plugin-app-supervisor'
---

# Режим мультисередовища

## Вступ

Підходить для підвищених вимог до стабільності, ізоляції та масштабування.

## Розгортання

- Supervisor: central control plane
- Worker: runtime environment
- Redis: config cache and command channel

### Архітектурні залежності

- Redis
- Database service for Supervisor and Workers

### Вхідний застосунок (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### Робочий застосунок (Worker)

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

## Посібник користувача

### Список середовищ

![](https://static-docs.nocobase.com/202512291830371.png)

### Створення застосунку

![](https://static-docs.nocobase.com/202512291835086.png)

### Список застосунків

![](https://static-docs.nocobase.com/202512291842216.png)

### Запуск застосунку

![](https://static-docs.nocobase.com/202512291841727.png)

### Проксі-доступ

Use `/apps/:appName/admin` via Supervisor.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
