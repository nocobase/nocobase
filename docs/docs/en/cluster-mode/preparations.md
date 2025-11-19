# Prerequisites

Before deploying a cluster application, you need to complete the following preparations.

## Commercial Plugin License

Running a NocoBase application in cluster mode requires support from the following plugins:

| Function                 | Plugin                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Cache adapter            | Built-in                                                                            |
| Sync signal adapter      | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Message queue adapter    | `@nocobase/plugin-queue-adapter-redis` or `@nocobase/plugin-queue-adapter-rabbitmq` |
| Distributed lock adapter | `@nocobase/plugin-lock-adapter-redis`                                               |
| Worker ID allocator      | `@nocobase/plugin-workerid-allocator-redis`                                         |

First, please ensure you have obtained licenses for the above plugins (you can purchase the corresponding plugin licenses through the commercial plugin service platform).

## System Components

Other system components, besides the application instance itself, can be selected by operations personnel based on the team's operational needs.

### Database

Since the current cluster mode only targets application instances, the database temporarily supports only a single node. If you have a database architecture like master-slave, you need to implement it yourself through middleware and ensure it is transparent to the NocoBase application.

### Middleware

NocoBase's cluster mode relies on some middleware to achieve inter-cluster communication and coordination, including:

- **Cache**: Uses a Redis-based distributed cache middleware to improve data access speed.
- **Sync signal**: Uses Redis's stream feature to implement sync signal transmission between clusters.
- **Message queue**: Uses Redis or RabbitMQ-based message queue middleware to implement asynchronous message processing.
- **Distributed lock**: Uses a Redis-based distributed lock to ensure the security of access to shared resources in the cluster.

When all middleware components use Redis, you can start a single Redis service within the cluster's internal network (or Kubernetes). Alternatively, you can enable a separate Redis service for each function (cache, sync signal, message queue, and distributed lock).

**Version Recommendations**

- Redis: >=8.0 or a redis-stack version that includes the Bloom Filter feature.
- RabbitMQ: >=4.0

### Shared Storage

NocoBase needs to use the storage directory to store system-related files. In multi-node mode, you should mount a cloud disk (or NFS) to support shared access across multiple nodes. Otherwise, local storage will not be automatically synchronized, and it will not function properly.

When deploying with Kubernetes, please refer to the [Kubernetes Deployment: Shared Storage](./kubernetes#shared-storage) section.

### Load Balancing

Cluster mode requires a load balancer to distribute requests, as well as for health checks and failover of application instances. This part should be selected and configured according to the team's operational needs.

Taking a self-hosted Nginx as an example, add the following content to the configuration file:

```
upstream myapp {
    # ip_hash; # Can be used for session persistence. When enabled, requests from the same client are always sent to the same backend server.
    server 172.31.0.1:13000; # Internal node 1
    server 172.31.0.2:13000; # Internal node 2
    server 172.31.0.3:13000; # Internal node 3
}

server {
    listen 80;

    location / {
        # Use the defined upstream for load balancing
        proxy_pass http://myapp;
        # ... other configurations
    }
}
```

This means that requests are reverse-proxied and distributed to different server nodes for processing.

For load balancing middleware provided by other cloud service providers, please refer to the configuration documentation provided by the specific provider.

## Environment Variable Configuration

All nodes in the cluster should use the same environment variable configuration. In addition to NocoBase's basic [environment variables](/api/cli/env), the following middleware-related environment variables also need to be configured.

### Multi-core Mode

When the application runs on a multi-core node, you can enable the node's multi-core mode:

```ini
# Enable PM2 multi-core mode
# CLUSTER_MODE=max # Disabled by default, requires manual configuration
```

If you are deploying application pods in Kubernetes, you can ignore this configuration and control the number of application instances through the number of pod replicas.

### Cache

```ini
# Cache adapter, needs to be set to redis in cluster mode (defaults to in-memory if not set)
CACHE_DEFAULT_STORE=redis

# Redis cache adapter connection URL, needs to be filled in
CACHE_REDIS_URL=
```

### Sync Signal

```ini
# Redis sync adapter connection URL, defaults to redis://localhost:6379/0 if not set
PUBSUB_ADAPTER_REDIS_URL=
```

### Distributed Lock

```ini
# Lock adapter, needs to be set to redis in cluster mode (defaults to in-memory local lock if not set)
LOCK_ADAPTER_DEFAULT=redis

# Redis lock adapter connection URL, defaults to redis://localhost:6379/0 if not set
LOCK_ADAPTER_REDIS_URL=
```

### Message Queue

```ini
# Enable Redis as the message queue adapter, defaults to in-memory adapter if not set
QUEUE_ADAPTER=redis
# Redis message queue adapter connection URL, defaults to redis://localhost:6379/0 if not set
QUEUE_ADAPTER_REDIS_URL=
```

### Worker ID Allocator

Some system collections in NocoBase use globally unique IDs as primary keys. To prevent primary-key conflicts across a cluster, each application instance must obtain a unique Worker ID through the Worker ID Allocator. The current Worker ID range is 0–31, meaning each application can run up to 32 nodes simultaneously.
For details on the global unique ID design, [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id)

```ini
# Redis connection URL for the Worker ID Allocator.
# If omitted, a random Worker ID will be assigned.
REDIS_URL=
```

:::info{title=Tip}
Usually, the related adapters can all use the same Redis instance, but it is best to use different databases to avoid potential key conflict issues, for example:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Currently, each plugin uses its own Redis-related environment variables. In the future, we may use `REDIS_URL` as the fallback configuration.

:::

If you use Kubernetes to manage the cluster, you can configure the above environment variables in a ConfigMap or Secret. For more related content, you can refer to [Kubernetes Deployment](./kubernetes).

After all the above preparations are completed, you can proceed to the [Operations](./operations) to continue managing the application instances.
