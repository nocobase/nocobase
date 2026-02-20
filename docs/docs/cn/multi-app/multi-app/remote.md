---
pkg: '@nocobase/plugin-app-supervisor'
---

# 多环境模式

:::info🚀 即将发布
:::

## 介绍

共享内存模式的多应用在部署和运维上具有明显优势，但随着应用数量和业务复杂度的提升，单一实例可能逐渐面临资源争用、稳定性下降等问题。针对这类场景，用户可以采用多环境混合部署方案，以支撑更复杂的业务需求。

在该模式下，系统通过部署一个入口应用作为统一的管理与调度中心，同时部署多个 NocoBase 实例作为独立的应用运行环境，负责实际承载业务应用。各环境之间相互隔离、协同工作，从而有效分散单实例压力，显著提升系统的稳定性、可扩展性与故障隔离能力。

在部署层面，不同环境既可以运行在独立进程中，也可以部署为不同的 Docker 容器，或以多个 Kubernetes Deployment 的形式存在，能够灵活适配不同规模和架构的基础设施环境。

## 部署

在多环境混合部署模式下：

- 入口应用（Supervisor） 负责统一管理应用与环境信息
- 工作应用（Worker） 作为实际的业务运行环境
- 应用与环境配置通过 Redis 缓存
- 入口应用与工作应用之间的指令、状态同步依赖 Redis 通信

目前尚未提供环境创建功能，各工作应用需要手工部署并配置好对应的环境信息后，才能被入口应用识别。

### 架构依赖

在部署前请准备好以下服务：

- Redis
  - 缓存应用与环境配置
  - 作为入口应用与工作应用之间的命令通信通道

- 数据库
  - 入口应用与工作应用需连接的数据库服务

### 入口应用 (Supervisor)

入口应用作为统一管理中心，负责应用创建、启动、停止及环境调度，以及应用访问代理。

入口应用环境变量配置说明

```bash
# 应用模式
APP_MODE=supervisor
# 应用发现方式
APP_DISCOVERY_ADAPTER=remote
# 应用进程管理方式
APP_PROCESS_ADAPTER=remote
# 应用、环境配置缓存 redis
APP_SUPERVISOR_REDIS_URL=
# 应用命令通信方式
APP_COMMAND_ADPATER=redis
# 应用命令通信 redis
APP_COMMAND_REDIS_URL=
```

### 工作应用 (Worker)

工作应用作为实际的业务运行环境，负责承载和运行具体的 NocoBase 应用实例。

工作应用环境变量配置说明

```bash
# 应用模式
APP_MODE=worker
# 应用发现方式
APP_DISCOVERY_ADAPTER=remote
# 应用进程管理方式
APP_PROCESS_ADAPTER=local
# 应用、环境配置缓存 redis
APP_SUPERVISOR_REDIS_URL=
# 应用命令通信方式
APP_COMMAND_ADPATER=redis
# 应用命令通信 redis
APP_COMMAND_REDIS_URL=
# 环境标识
ENVIRONMENT_NAME=
# 环境访问 URL
ENVIRONMENT_URL=
# 环境代理访问 URL
ENVIRONMENT_PROXY_URL=
```

### Docker Compose 示例

以下示例展示了一个以 Docker 容器为运行单元的多环境混合部署方案，通过 Docker Compose 同时部署一个入口应用和两个工作应用。

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

## 使用手册

应用基础的管理操作与共享内存模式无异，请参考[共享内存模式](./local.md)。这部分主要介绍与多环境配置相关的内容。

### 环境列表

部署完成后，进入入口应用的「应用监管器」页面，可以在「环境」标签页中查看已注册的工作环境列表。其中包括环境标识、工作应用版本，访问 URL 及状态等信息。工作应用每隔 2 分钟上报一次心跳，以确保环境的可用性。

![](https://static-docs.nocobase.com/202512291830371.png)

### 应用创建

在创建应用时，可以选择一个到多个运行环境，用于指定该应用将被部署到哪些工作应用中。通常情况下，建议选择一个环境即可。仅在工作应用进行了[服务拆分](/cluster-mode/services-splitting)，需要将同一应用部署到多个运行环境以实现负载分担或能力隔离的时候，才选择多个环境。

![](https://static-docs.nocobase.com/202512291835086.png)

### 应用列表

应用列表页面会显示每个应用当前所在的运行环境及状态信息。如果应用部署在多个环境中，则会显示多个运行状态。多个环境中的同一应用在正常情况下会保持统一状态，需要统一控制启动和停止。

![](https://static-docs.nocobase.com/202512291842216.png)

### 应用启动

由于应用启动时可能会向数据库写入初始化数据，为了避免多环境下的竞态条件，部署多个环境中的应用在启动时，会排队进行。

![](https://static-docs.nocobase.com/202512291841727.png)

### 应用访问代理

工作应用可以通过入口应用的子路径 `/apps/:appName/admin` 进行代理访问。

![](https://static-docs.nocobase.com/202601082154230.png)

如果应用部署在多个环境中，需要指定一个代理访问的目标环境。

![](https://static-docs.nocobase.com/202601082155146.png)

默认情况下，代理访问地址使用工作应用的访问地址，对应环境变量为 `ENVIRONMENT_URL`，需确保该地址在入口应用所在的网络环境中可访问。如需使用不同的代理访问地址，可通过环境变量 `ENVIRONMENT_PROXY_URL` 进行覆盖。
