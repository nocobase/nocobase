---
title: "集群部署准备工作"
description: "集群部署前准备：商业插件授权（PubSub、Queue、Lock、WorkerID 适配器）、数据库、Redis/RabbitMQ 中间件、共享存储、负载均衡配置。"
keywords: "集群准备,商业插件授权,Redis 中间件,RabbitMQ,共享存储,负载均衡,Nginx,NocoBase"
---

# 准备工作

部署集群应用前，需要完成以下准备工作。

## 商业插件授权

NocoBase 应用以集群方式运行需要基于以下插件支持：

| 功能             | 插件                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| 缓存适配器       | 内置                                                                                |
| 同步信号适配器   | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| 消息队列适配器   | `@nocobase/plugin-queue-adapter-redis` 或 `@nocobase/plugin-queue-adapter-rabbitmq` |
| 分布式锁适配器   | `@nocobase/plugin-lock-adapter-redis`                                               |
| Worker ID 分配器 | `@nocobase/plugin-workerid-allocator-redis`                                         |

首先请确保你已经获得了以上插件的授权（可以通过商业插件服务平台购买相应的插件授权）。

## 系统组件

除应用实例本身以外，集群部署还需要数据库、中间件、共享存储和负载均衡等系统组件。不同团队可按自身运维体系选择这些组件的具体实现方式。

### 数据库

由于目前的集群模式只针对应用实例，数据库暂时只支持单节点，如有主从等数据库架构，需要自行通过中间件实现，并保证对 NocoBase 应用透明。

如需跨可用区或跨地域的热备、容灾能力，数据库同步和切换策略需要由运维团队自行设计和实现。

### 中间件

NocoBase 的集群模式需要依赖一些中间件来实现集群间的通信和协调，包括：

- **缓存**：使用基于 Redis 的分布式缓存中间件，提高数据访问速度。
- **同步信号**：使用基于 Redis 的 stream 功能实现集群间的同步信号传递。
- **消息队列**：使用基于 Redis 或 RabbitMQ 的消息队列中间件，实现异步消息处理。
- **分布式锁**：使用基于 Redis 的分布式锁，保证集群中对共享资源的访问安全。

当所有中间件均使用 Redis 时，可在集群内网（或 Kubernetes）中，启动一个单一的 Redis 服务。也可以根据不同功能（缓存、同步信号、消息队列和分布式锁）各自启用一个 Redis 服务。

**版本建议**

- Redis：>=8.0 或使用包含 Bloom Filter 功能的 redis-stack 版本。
- RabbitMQ：>=4.0

### 共享存储

NocoBase 需要使用 storage 目录存储系统相关的文件，也是集群部署的必需组件。在多节点模式下可以根据基础设施环境选择不同实现，例如云盘、NFS、EFS 等，以支持多节点共享访问。否则系统文件不会自动同步，将无法正常使用。

使用 Kubernetes 部署时，请参考 [Kubernetes 部署：共享存储](./kubernetes#共享存储) 章节。

#### `storage` 目录通常会保存什么

`storage` 目录中的内容会随启用的插件和部署方式不同而变化。结合当前实现，常见内容包括：

| 路径 | 用途 | 使用建议 |
| --- | --- | --- |
| `storage/uploads` | 本地存储模式下的上传文件 | 生产集群优先改用 S3 / OSS / COS 等对象存储 |
| `storage/plugins` | 运行时安装、上传或发现的本地插件包 | 如依赖本地插件，必须共享；如插件已随镜像构建，可减少这部分依赖 |
| `storage/apps/<app>/jwt_secret.dat` | 未显式配置 `APP_KEY` 时自动生成的默认 token 密钥 | 生产环境不要依赖该文件，应改为显式配置 `APP_KEY` |
| `storage/apps/<app>/aes_key.dat` | 未显式配置 `APP_AES_SECRET_KEY` 时自动生成的 AES 密钥 | 生产环境不要依赖该文件，应改为显式配置 `APP_AES_SECRET_KEY` |
| `storage/environment-variables/<app>/aes_key.dat` | 环境变量插件场景下的 AES 密钥文件 | 建议只读密钥文件挂载 |
| `storage/logs` | 默认日志目录，以及部分迁移日志 | 建议未来接入外部日志平台 |
| `storage/tmp` | 导入、导出、迁移等临时文件 | 可以是临时目录，但涉及跨节点复用时应共享，或固定到单管理节点执行 |
| `storage/backups`、`storage/duplicator`、`storage/migration-manager` | 备份、恢复、迁移相关产物 | 建议视为运维目录，持久化保存，并避免多节点并发修改 |

上表并非穷尽列表，但可以说明一个关键点：`storage` 中混合了业务文件、密钥文件、插件目录、日志和运维临时产物，因此集群部署时通常应以“整个 `/app/nocobase/storage` 共享持久化”为基线。

#### 存储相关建议

NocoBase 的集群一致性主要依赖数据库、Redis、消息队列和分布式锁等机制，而不是把共享文件系统当作高并发协调介质来使用。

因此建议：

- 附件等高频业务文件优先使用对象存储，不建议在生产集群中长期依赖本地存储。
- 共享存储主要用于承载 `storage` 目录，而不是作为高吞吐文件存储服务。
- 插件安装、插件升级、备份、恢复、迁移等操作，需要缩容至单个节点后执行，完成后再扩容。

如果只是多个节点同时读取同一份上传文件或同一份插件包，共享文件系统通常没有问题；真正需要避免的是多个节点对同一路径进行无序并发写入。

### 负载均衡

集群模式需要通过负载均衡器来实现请求的分发，以及应用实例的健康检查和故障转移。该部分根据团队运维需求自行选择和配置。

以自建 Nginx 为例，在配置文件中增加以下内容：

```
upstream myapp {
    server 172.31.0.1:13000; # 内网节点1
    server 172.31.0.2:13000; # 内网节点2
    server 172.31.0.3:13000; # 内网节点3
}

server {
    listen 80;

    location / {
        # 使用定义的 upstream 进行负载均衡
        proxy_pass http://myapp;
        # ... 其他配置
    }
}
```

意为将请求反代分发到不同的服务器节点进行处理。

其他云服务商提供的负载均衡中间件可参考具体服务商提供的配置文档。

对于高可用部署，建议：

- 在同一集群内至少运行 2 个应用实例，并由负载均衡器负责实例故障切换。
- 负载均衡器的健康检查要覆盖应用真实可用性，而不仅是端口存活。
- 如需跨可用区或跨地域热备，通常应部署多个独立集群，并由运维团队负责数据库、共享存储等基础设施的数据同步与切换。

## 环境变量配置

集群内的所有节点应使用同样的环境变量配置，除 NocoBase 基本的[环境变量](/api/cli/env)，还需配置以下与中间件相关的环境变量。

### 关键密钥

除中间件环境变量外，集群内所有节点还应显式配置相同的关键密钥：

```ini
APP_KEY=
APP_AES_SECRET_KEY=
# 或者使用只读文件挂载
# APP_AES_SECRET_KEY_PATH=
```

- `APP_KEY` 用于 token / JWT 等签名能力。若不显式配置，应用会回退到 `storage` 下的默认密钥文件。
- `APP_AES_SECRET_KEY` 用于数据库中敏感字段的 AES 解密。若不显式配置，应用也会回退到 `storage` 下的默认密钥文件。
- 对于临时容器或多节点部署，依赖自动生成的本地密钥会导致重启后 token 失效，或历史加密数据无法解密。

:::info{title=提示}
`APP_AES_SECRET_KEY` 需要是一个 32 字节的 AES-256 密钥，对应 64 个十六进制字符。

在云环境中，推荐通过 Secrets Manager、SSM Parameter Store、Kubernetes Secret 或挂载只读密钥文件的方式统一管理这些值。
:::

### 多核模式

应用运行在多核节点时，可以开启节点的多核模式：

```ini
# 开启 PM2 多核模式
# CLUSTER_MODE=max # 默认不开启，需要手动配置
```

如在 Kubernetes 中部署应用 pod，可以忽略该配置，通过 pod 的副本数来控制应用实例数量。

### 缓存

```ini
# 缓存适配器，集群模式下需要填写为 redis（默认不填为内存）
CACHE_DEFAULT_STORE=redis

# Redis 缓存适配器连接地址，需要主动填写
CACHE_REDIS_URL=
```

### 同步信号

```ini
# Redis 同步适配器连接地址，默认不填为 redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=
```

### 分布式锁

```ini
# 锁适配器，集群模式下需要填写为 redis（默认不填为内存本地锁）
LOCK_ADAPTER_DEFAULT=redis

# Redis 锁适配器连接地址，默认不填为 redis://localhost:6379/0
LOCK_ADAPTER_REDIS_URL=
```

### 消息队列

```ini
# 启用 Redis 作为消息队列适配器，默认不填为内存适配器
QUEUE_ADAPTER=redis
# Redis 消息队列适配器连接地址，默认不填为 redis://localhost:6379/0
QUEUE_ADAPTER_REDIS_URL=
```

### Worker ID 分配器

由于 NocoBase 中的部分系统表使用全局唯一 ID 作为主键，因此需要通过 Worker ID 分配器来保证集群中每个应用实例分配到唯一的 Worker ID，从而避免主键冲突问题。目前设计的 Worker ID 范围为 0-31, 即相同应用最多支持 32 个节点同时运行。关于全局唯一 ID 的设计，参考 [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id)

```ini
# Worker ID 分配器 Redis 连接地址，默认不填为随机分配
REDIS_URL=
```

:::info{title=提示}
通常情况，相关的适配器可以都使用同一个 Redis 实例，但最好区分使用不同的数据库，以避免可能存在的键冲突问题，例如：

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

现阶段各插件采用各自的 Redis 环境变量配置，未来会考虑统一使用 `REDIS_URL` 作为兜底配置。

:::

如使用 Kubernetes 管理集群，可以将上述环境变量配置在 ConfigMap 或 Secret 中，更多相关内容可以参考 [Kubernetes 部署](./kubernetes)。

以上所有准备工作完成后，可以进入[运维流程](./operations)，继续管理应用实例。
