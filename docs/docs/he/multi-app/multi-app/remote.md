---
pkg: '@nocobase/plugin-app-supervisor'
---

# מצב ריבוי סביבות

## מבוא

מתאים לדרישות גבוהות של יציבות, בידוד והתרחבות.

## פריסה

- Supervisor: central control plane
- Worker: runtime environment
- Redis: config cache and command channel

### תלויות ארכיטקטורה

- Redis
- Database service for Supervisor and Workers

### יישום כניסה (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### יישום Worker (Worker)

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

## מדריך שימוש

### רשימת סביבות

![](https://static-docs.nocobase.com/202512291830371.png)

### יצירת יישום

![](https://static-docs.nocobase.com/202512291835086.png)

### רשימת יישומים

![](https://static-docs.nocobase.com/202512291842216.png)

### הפעלת יישום

![](https://static-docs.nocobase.com/202512291841727.png)

### גישת פרוקסי

Use `/apps/:appName/admin` via Supervisor.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
