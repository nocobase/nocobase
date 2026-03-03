---
pkg: '@nocobase/plugin-app-supervisor'
---

# وضع البيئات المتعددة

## مقدمة

هذا الوضع مناسب للتوسع الأفقي وزيادة الاستقرار بين التطبيقات.

## النشر

- Supervisor: central control plane
- Worker: runtime environment
- Redis: config cache and command channel

### متطلبات البنية

- Redis
- Database service for Supervisor and Workers

### تطبيق الدخول (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### تطبيق العامل (Worker)

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

## دليل الاستخدام

### قائمة البيئات

![](https://static-docs.nocobase.com/202512291830371.png)

### إنشاء تطبيق

![](https://static-docs.nocobase.com/202512291835086.png)

### قائمة التطبيقات

![](https://static-docs.nocobase.com/202512291842216.png)

### بدء التطبيق

![](https://static-docs.nocobase.com/202512291841727.png)

### وصول الوكيل

Use `/apps/:appName/admin` via Supervisor.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
