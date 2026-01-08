---
pkg: '@nocobase/plugin-app-supervisor'
---

# Multi-Environment Mode

:::info 🚀 Coming soon
:::

## Introduction

The shared-memory multi-application mode provides clear advantages in deployment and operations. However, as the number of applications and business complexity increase, a single instance may gradually face challenges such as resource contention and reduced stability. For these scenarios, a **multi-environment hybrid deployment** can be adopted to support more complex business requirements.

In this mode, the system deploys one **entry application** as a unified management and scheduling center, and multiple **NocoBase instances** as independent application runtime environments that actually host business applications. Environments are isolated from each other while working collaboratively, effectively distributing load and significantly improving system stability, scalability, and fault isolation.

At the deployment level, different environments can run as separate processes, Docker containers, or multiple Kubernetes Deployments, allowing flexible adaptation to infrastructures of different scales and architectures.

## Deployment

In multi-environment hybrid deployment mode:

- The **entry application (Supervisor)** is responsible for unified management of applications and environments
- **Worker applications (Workers)** act as actual business runtime environments
- Application and environment configurations are cached in Redis
- Command dispatching and status synchronization between Supervisor and Workers rely on Redis

Environment creation is not yet provided. Each Worker application must be deployed manually and configured with environment information before it can be discovered by the Supervisor.

### Architecture Dependencies

Before deployment, prepare the following services:

- **Redis**
  - Caches application and environment configuration
  - Acts as the command communication channel between Supervisor and Workers

- **Database**
  - Database services used by both Supervisor and Workers

### Entry Application (Supervisor)

The Supervisor acts as the unified control plane, responsible for application creation, start/stop, environment scheduling, and application access proxying.

Supervisor environment variables:

```bash
# Application mode
APP_MODE=supervisor
# Application discovery adapter
APP_DISCOVERY_ADAPTER=remote
# Application process adapter
APP_PROCESS_ADAPTER=remote
# Redis for application and environment configuration cache
APP_SUPERVISOR_REDIS_URL=
# Command communication adapter
APP_COMMAND_ADPATER=redis
# Redis for command communication
APP_COMMAND_REDIS_URL=
```

### Worker Application (Worker)

Workers act as actual business runtime environments, hosting and running concrete NocoBase application instances.

Worker environment variables:

```bash
# Application mode
APP_MODE=worker
# Application discovery adapter
APP_DISCOVERY_ADAPTER=remote
# Application process adapter
APP_PROCESS_ADAPTER=local
# Redis for application and environment configuration cache
APP_SUPERVISOR_REDIS_URL=
# Command communication adapter
APP_COMMAND_ADPATER=redis
# Redis for command communication
APP_COMMAND_REDIS_URL=
# Environment identifier
ENVIRONMENT_NAME=
# Environment access URL
ENVIRONMENT_URL=
# Environment proxy URL
ENVIRONMENT_PROXY_URL=
```

### Docker Compose Example

The following example demonstrates a multi-environment hybrid deployment using Docker containers as runtime units. One Supervisor and two Workers are deployed via Docker Compose.

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest

  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'

  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'

  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## User Guide

Basic application management operations are the same as in shared-memory mode. See [Shared-Memory Mode](./local.md) for details. This section focuses on multi-environment–specific configuration.

### Environment List

After deployment, open **App Supervisor** in the entry application. In the **Environments** tab, you can view registered worker environments, including environment identifier, worker version, access URL, and status. Workers report a heartbeat every 2 minutes to ensure availability.

![](https://static-docs.nocobase.com/202512291830371.png)

### Creating an Application

When creating an application, you can select one or more runtime environments to specify where the application will be deployed. In most cases, selecting a single environment is recommended. Multiple environments should only be selected when [service splitting](/cluster-mode/services-splitting) is used to deploy the same application across environments for load balancing or capability isolation.

![](https://static-docs.nocobase.com/202512291835086.png)

### Application List

The application list shows the runtime environments and status for each application. If an application is deployed to multiple environments, multiple runtime states are displayed. Under normal conditions, the same application across environments remains in a consistent state and must be started or stopped in a unified manner.

![](https://static-docs.nocobase.com/202512291842216.png)

### Starting an Application

Since application startup may write initialization data to the database, applications deployed across multiple environments are started **sequentially** to avoid race conditions.

![](https://static-docs.nocobase.com/202512291841727.png)

### Application Access Proxy

Worker applications can be accessed through the entry application via the sub-path `/apps/:appName/admin`.

![](https://static-docs.nocobase.com/202601082154230.png)

When an application is deployed across multiple environments, a specific target environment must be selected for proxy access.

![](https://static-docs.nocobase.com/202601082155146.png)

By default, the proxy uses the worker application’s access address defined by the `ENVIRONMENT_URL` environment variable. This address must be reachable from the network where the entry application is running. If a different proxy access address is required, it can be overridden using the `ENVIRONMENT_PROXY_URL` environment variable.
