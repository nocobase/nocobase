# 集群模式

<PluginInfo licenseBundled="enterprise" plugins="pubsub-adapter-redis,lock-adapter-redis,queue-adapter-redis"></PluginInfo>

NocoBase 自 v1.6.0 版本开始支持以集群模式运行应用。应用以集群模式运行时，可以通过多个实例和使用多核模式来提高应用的对并发访问处理的性能。

## 系统架构

![20241231010814](https://static-docs.nocobase.com/20241231010814.png)

### 架构组件

目前的集群模式仅针对应用实例，分布式架构中的其他系统组件根据不同团队的运维需求，在符合当前约束的条件下，由团队的运维人员自行选用。

#### 应用集群

应用集群是 NocoBase 应用的实例集合，每个实例可以是一个独立的节点，或是在单机上以多核模式运行的多个应用进程，也可以两者混合使用。

#### 数据库

由于目前的集群模式只针对应用实例，数据库暂时只支持单节点，如有主从等数据库架构，需要自行通过中间件实现，并保证对 NocoBase 应用透明。

#### 缓存、同步信号、消息队列和分布式锁

NocoBase 集群模式需要依赖缓存、同步信号、消息队列和分布式锁等中间件来实现集群间的通信和协调，目前初步支持使用 Redis 作为相应功能的中间件。

#### 负载均衡

NocoBase 集群模式需要通过负载均衡器来实现请求的分发，以及应用实例的健康检查和故障转移。该部分根据团队运维需求自行选择和配置。

## 部署步骤

### 基础设施准备

#### 负载均衡

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

#### Redis 服务

在集群内网（或 k8s）中，启动一个 Redis 服务。或根据不同功能（缓存、同步信号、消息队列和分布式锁）各自启用一个 Redis 服务。

#### 本地存储（按需）

如使用了本地存储，在多节点模式下应通过挂载云盘作为本地存储目录，以支持多节点共享访问。否则本地存储不会自动同步，将无法正常使用。

如不使用本地存储，在应用启动后，需要将基于云服务的文件存储空间设置为默认文件存储空间，并将应用的 Logo（或其他文件）迁移到云存储空间。

### 相关插件准备

| 功能 | 插件 |
| --- | --- |
| 缓存 | 内置 |
| 同步信号 | @nocobase/plugin-pubsub-adapter-redis |
| 消息队列 | @nocobase/plugin-queue-adapter-redis |
| 分布式锁 | @nocobase/plugin-lock-adapter-redis |

:::info{title=提示}
与单节点模式的应用一样，只要配置了商业插件服务平台相关的环境变量，应用启动后会自动下载相应的插件。
:::

### 环境变量配置

除基本的环境变量外，以下环境变量所有节点均需配置，且需要保持一致。

#### 应用密钥

用于用户登录时创建 JWT Token 的密钥，建议使用随机字符串。

```ini
APP_KEY=
```

#### 多核模式

```ini
# 开启 PM2 多核模式
# CLUSTER_MODE=max # 默认不开启，需要手动配置
```

#### 缓存

```ini
# 缓存适配器，集群模式下需要填写为 redis（默认不填为内存）
CACHE_DEFAULT_STORE=redis

# Redis 缓存适配器连接地址，需要主动填写
CACHE_REDIS_URL=
```

#### 同步信号

```ini
# Redis 同步适配器连接地址，默认不填为 redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=
```

#### 分布式锁

```ini
# 锁适配器，集群模式下需要填写为 redis（默认不填为内存本地锁）
LOCK_ADAPTER_DEFAULT=redis

# Redis 锁适配器连接地址，默认不填为 redis://localhost:6379/0
LOCK_ADAPTER_REDIS_URL=
```

#### 消息队列

```ini
# 启用 Redis 作为消息队列适配器，默认不填为内存适配器
QUEUE_ADAPTER=redis
# Redis 消息队列适配器连接地址，默认不填为 redis://localhost:6379/0
QUEUE_ADAPTER_REDIS_URL=
```

:::info{title=提示}
通常情况，相关的适配器可以都使用同一个 Redis 实例，但最好区分使用不同的数据库，以避免可能存在的键冲突问题，例如：

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
```
:::

#### 内置插件启用

```ini
# 内置要开启的插件
APPEND_PRESET_BUILT_IN_PLUGINS=lock-adapter-redis,pubsub-adapter-redis,queue-adapter-redis
```

### 启动应用

首次启动应用时，应先启动其中一个节点，等待插件安装完毕并启用后，再启动其他节点。

## 升级或维护

当需要升级 NocoBase 版本或启用/禁用插件时，参考此流程处理。

:::warning{title=注意}
在集群生产环境需要谨慎或禁止使用插件管理和版本升级等功能。

NocoBase 暂时未实现集群版本的在线升级，为确保数据一致性，在升级过程中需要暂停服务。
:::

### 停止当前服务

停止所有 NocoBase 应用实例，Redis 等中间件，并将负载均衡的流量转发至 503 状态页面。

### 备份数据

在升级前，强烈建议备份数据库数据，以防止升级过程中出现异常。

### 更新版本

参考 [Docker 升级](../upgrading/docker-compose.md) 更新 NocoBase 应用镜像的版本。

### 启动服务

1. 重新依赖的中间件（Redis）
2. 启动集群中的一个节点，等待更新完毕并启动成功
3. 验证功能正确，如有异常且排查无法解决，可回滚至上一个版本
4. 启动其他节点
5. 转移负载均衡的流量至应用集群

## 更多参考

本文档仅介绍了 NocoBase 集群模式的基本概念和部署步骤，更多配置项和具体场景，可以参考以下文档：

- [服务拆分](./services-splitting.md)
<!-- - [Kubernetes 部署](./kubernetes.md) -->
