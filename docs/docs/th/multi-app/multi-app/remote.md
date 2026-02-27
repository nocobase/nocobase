---
pkg: '@nocobase/plugin-app-supervisor'
---

# โหมดหลายสภาพแวดล้อม

## บทนำ

เหมาะเมื่อเน้นเสถียรภาพ การแยกส่วน และการขยายระบบ.

## การปรับใช้

- Supervisor: central control plane
- Worker: runtime environment
- Redis: config cache and command channel

### ส่วนพึ่งพาทางสถาปัตยกรรม

- Redis
- Database service for Supervisor and Workers

### แอปทางเข้า (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### แอป Worker (Worker)

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

## คู่มือการใช้งาน

### รายการสภาพแวดล้อม

![](https://static-docs.nocobase.com/202512291830371.png)

### การสร้างแอปพลิเคชัน

![](https://static-docs.nocobase.com/202512291835086.png)

### รายการแอปพลิเคชัน

![](https://static-docs.nocobase.com/202512291842216.png)

### การเริ่มแอปพลิเคชัน

![](https://static-docs.nocobase.com/202512291841727.png)

### พร็อกซีการเข้าถึง

Use `/apps/:appName/admin` via Supervisor.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
