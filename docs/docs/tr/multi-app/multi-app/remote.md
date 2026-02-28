---
pkg: '@nocobase/plugin-app-supervisor'
---

# Çoklu Ortam Modu

## Giriş

Daha yüksek stabilite, izolasyon ve ölçek gereksinimlerinde uygundur.

## Dağıtım

- Supervisor: central control plane
- Worker: runtime environment
- Redis: config cache and command channel

### Mimari bağımlılıklar

- Redis
- Database service for Supervisor and Workers

### Giriş uygulaması (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### Worker uygulaması (Worker)

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

## Kullanım kılavuzu

### Ortam listesi

![](https://static-docs.nocobase.com/202512291830371.png)

### Uygulama oluşturma

![](https://static-docs.nocobase.com/202512291835086.png)

### Uygulama listesi

![](https://static-docs.nocobase.com/202512291842216.png)

### Uygulama başlatma

![](https://static-docs.nocobase.com/202512291841727.png)

### Erişim proxy

Use `/apps/:appName/admin` via Supervisor.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
