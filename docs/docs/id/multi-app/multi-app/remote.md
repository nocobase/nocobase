---
pkg: '@nocobase/plugin-app-supervisor'
---

# Mode Multi-Lingkungan

## Pendahuluan

Pilih mode ini saat butuh stabilitas, isolasi, dan skalabilitas lebih tinggi.

## Penyebaran

- Supervisor: central control plane
- Worker: runtime environment
- Redis: config cache and command channel

### Dependensi Arsitektur

- Redis
- Database service for Supervisor and Workers

### Aplikasi Entry (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### Aplikasi Worker (Worker)

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

## Panduan Pengguna

### Daftar Lingkungan

![](https://static-docs.nocobase.com/202512291830371.png)

### Membuat Aplikasi

![](https://static-docs.nocobase.com/202512291835086.png)

### Daftar Aplikasi

![](https://static-docs.nocobase.com/202512291842216.png)

### Menjalankan Aplikasi

![](https://static-docs.nocobase.com/202512291841727.png)

### Akses Proxy

Use `/apps/:appName/admin` via Supervisor.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
