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

In addition to the application instances themselves, cluster deployment also requires system components such as the database, middleware, shared storage, and load balancing. Different teams can choose the specific implementation of these components based on their own operating model.

### Database

Since the current cluster mode only targets application instances, the database temporarily supports only a single node. If you have a database architecture like master-slave, you need to implement it yourself through middleware and ensure it is transparent to the NocoBase application.

If you need warm standby or disaster recovery across availability zones or regions, the database synchronization and switchover strategy must be designed and implemented by your operations team.

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

NocoBase needs to use the `storage` directory to store system-related files, and shared storage is also a required component of cluster deployment. In multi-node mode, you can choose different implementations based on your infrastructure environment, such as cloud disks, NFS, or EFS, to support shared access across multiple nodes. Otherwise, system files will not be synchronized automatically and the application will not work properly.

When deploying with Kubernetes, please refer to the [Kubernetes Deployment: Shared Storage](./kubernetes#shared-storage) section.

#### What is typically stored in the `storage` directory

The contents of the `storage` directory vary depending on the enabled plugins and the deployment method. Based on the current implementation, common contents include:

| Path | Purpose | Usage recommendation |
| --- | --- | --- |
| `storage/uploads` | Uploaded files when using local storage mode | In production clusters, prefer object storage such as S3 / OSS / COS |
| `storage/plugins` | Local plugin packages installed, uploaded, or discovered at runtime | If you rely on local plugins, this directory must be shared; if plugins are built into the image, this dependency can be reduced |
| `storage/apps/<app>/jwt_secret.dat` | Default token secret generated automatically when `APP_KEY` is not explicitly configured | Do not rely on this file in production; explicitly configure `APP_KEY` instead |
| `storage/apps/<app>/aes_key.dat` | Default AES key generated automatically when `APP_AES_SECRET_KEY` is not explicitly configured | Do not rely on this file in production; explicitly configure `APP_AES_SECRET_KEY` instead |
| `storage/environment-variables/<app>/aes_key.dat` | AES key file used in environment-variable plugin scenarios | A read-only mounted key file is recommended |
| `storage/logs` | Default log directory and some migration logs | It is recommended to integrate with an external logging platform in the future |
| `storage/tmp` | Temporary files for import, export, migration, etc. | It can be temporary, but if it needs to be reused across nodes, it must be shared, or the operation should be fixed to a single management node |
| `storage/backups`, `storage/duplicator`, `storage/migration-manager` | Artifacts related to backup, restore, and migration | These should be treated as operations directories, stored persistently, and not modified concurrently across multiple nodes |

The table above is not exhaustive, but it illustrates an important point: `storage` mixes business files, secret files, plugin directories, logs, and operations-related temporary artifacts. Therefore, in cluster deployment, the baseline is usually to persist and share the entire `/app/nocobase/storage`.

#### Storage recommendations

Cluster consistency in NocoBase mainly relies on the database, Redis, message queues, and distributed locks, rather than treating shared file systems as a high-concurrency coordination medium.

Therefore, the following is recommended:

- For high-frequency business files such as attachments, prefer object storage. In production clusters, long-term reliance on local storage is not recommended.
- Shared storage should mainly be used to host the `storage` directory, rather than as a high-throughput file storage service.
- Operations such as plugin installation, plugin upgrade, backup, restore, and migration should be performed only after scaling the cluster down to a single node, and the cluster can be scaled out again after completion.

### Load Balancing

Cluster mode requires a load balancer to distribute requests, as well as for health checks and failover of application instances. This part should be selected and configured according to the team's operational needs.

Taking a self-hosted Nginx as an example, add the following content to the configuration file:

```
upstream myapp {
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

For high-availability deployments, the following is recommended:

- Run at least 2 application instances within the same cluster, and let the load balancer handle instance failover.
- The health check of the load balancer should reflect actual application availability, not just whether the port is open.
- If you need warm standby across availability zones or regions, you would typically deploy multiple independent clusters, and the operations team would be responsible for synchronizing and switching the database, shared storage, and other infrastructure.

## Environment Variable Configuration

All nodes in the cluster should use the same environment variable configuration. In addition to NocoBase's basic [environment variables](/api/cli/env), the following middleware-related environment variables also need to be configured.

### Key Secrets

In addition to the middleware environment variables, all nodes in the cluster should also explicitly configure the same key secrets:

```ini
APP_KEY=
APP_AES_SECRET_KEY=
# Or use a read-only mounted key file
# APP_AES_SECRET_KEY_PATH=
```

- `APP_KEY` is used for token / JWT signing. If it is not explicitly configured, the application falls back to the default secret file under `storage`.
- `APP_AES_SECRET_KEY` is used to decrypt sensitive fields in the database. If it is not explicitly configured, the application also falls back to the default secret file under `storage`.
- In ephemeral containers or multi-node deployments, relying on automatically generated local secret files can cause tokens to become invalid after restart, or historical encrypted data to become undecryptable.

:::info{title=Tip}
`APP_AES_SECRET_KEY` must be a 32-byte AES-256 key, represented by 64 hexadecimal characters.

In cloud environments, it is recommended to manage these values centrally through services such as Secrets Manager, SSM Parameter Store, Kubernetes Secret, or a read-only mounted key file.
:::

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
