---
pkg: '@nocobase/plugin-app-supervisor'
---

# Chế độ đa môi trường

## Giới thiệu

Phù hợp khi cần độ ổn định, cách ly và khả năng mở rộng cao hơn.

## Triển khai

- Supervisor: central control plane
- Worker: runtime environment
- Redis: config cache and command channel

### Phụ thuộc kiến trúc

- Redis
- Database service for Supervisor and Workers

### Ứng dụng đầu vào (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### Ứng dụng Worker (Worker)

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

## Hướng dẫn sử dụng

### Danh sách môi trường

![](https://static-docs.nocobase.com/202512291830371.png)

### Tạo ứng dụng

![](https://static-docs.nocobase.com/202512291835086.png)

### Danh sách ứng dụng

![](https://static-docs.nocobase.com/202512291842216.png)

### Khởi động ứng dụng

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxy truy cập

Use `/apps/:appName/admin` via Supervisor.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
