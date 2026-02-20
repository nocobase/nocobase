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

除应用实例本身以外的其他系统组件，根据不同团队的运维需求，可由运维人员自行选用。

### 数据库

由于目前的集群模式只针对应用实例，数据库暂时只支持单节点，如有主从等数据库架构，需要自行通过中间件实现，并保证对 NocoBase 应用透明。

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

NocoBase 需要使用 storage 目录存储系统相关的文件，在多节点模式下应通过挂载云盘（或 NFS），以支持多节点共享访问。否则本地存储不会自动同步，将无法正常使用。

使用 Kubernetes 部署时，请参考 [Kubernetes 部署：共享存储](./kubernetes#共享存储) 章节。

### 负载均衡

集群模式需要通过负载均衡器来实现请求的分发，以及应用实例的健康检查和故障转移。该部分根据团队运维需求自行选择和配置。

以自建 Nginx 为例，在配置文件中增加以下内容：

```
upstream myapp {
    # ip_hash; # 可用于会话保持,开启后来自同一客户端的请求总是发送到同一个后端服务器。
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

## 环境变量配置

集群内的所有节点应使用同样的环境变量配置，除 NocoBase 基本的[环境变量](/api/cli/env)，还需配置以下与中间件相关的环境变量。

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
