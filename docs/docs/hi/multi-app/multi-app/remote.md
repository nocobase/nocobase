---
pkg: '@nocobase/plugin-app-supervisor'
---

# बहु-पर्यावरण मोड

## परिचय

उच्च स्थिरता, आइसोलेशन और स्केल की जरूरत पर यह मोड चुनें।

## परिनियोजन

- Supervisor: central control plane
- Worker: runtime environment
- Redis: config cache and command channel

### आर्किटेक्चर निर्भरताएँ

- Redis
- Database service for Supervisor and Workers

### एंट्री एप्लिकेशन (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### वर्कर एप्लिकेशन (Worker)

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

## उपयोग गाइड

### पर्यावरण सूची

![](https://static-docs.nocobase.com/202512291830371.png)

### एप्लिकेशन बनाना

![](https://static-docs.nocobase.com/202512291835086.png)

### एप्लिकेशन सूची

![](https://static-docs.nocobase.com/202512291842216.png)

### एप्लिकेशन शुरू करना

![](https://static-docs.nocobase.com/202512291841727.png)

### एक्सेस प्रॉक्सी

Use `/apps/:appName/admin` via Supervisor.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
