# Cluster Mode

<PluginInfo licenseBundled="enterprise" plugins="pubsub-adapter-redis,lock-adapter-redis,queue-adapter-redis"></PluginInfo>

Starting from v1.6.0, NocoBase supports running applications in cluster mode. When an application runs in cluster mode, it can improve its performance in handling concurrent access by using multiple instances and a multi-core mode.

## System Architecture


![20241231010814](https://static-docs.nocobase.com/20241231010814.png)


### Architecture Components

The current cluster mode only targets application instances. Other system components in the distributed architecture can be selected by the team's O&M personnel according to their needs, provided they meet the current constraints.

#### Application Cluster

An application cluster is a collection of NocoBase application instances. Each instance can be an independent node, multiple application processes running in multi-core mode on a single machine, or a mix of both.

#### Database

Since the current cluster mode only targets application instances, the database temporarily supports only a single node. If a database architecture like master-slave is required, it needs to be implemented through middleware and must be transparent to the NocoBase application.

#### Cache, Synchronization Signals, Message Queue, and Distributed Lock

NocoBase cluster mode relies on middleware such as cache, synchronization signals, message queue, and distributed lock to achieve communication and coordination between clusters. Currently, it preliminarily supports using Redis as the middleware for these functions.

#### Load Balancing

NocoBase cluster mode requires a load balancer to handle request distribution, as well as health checks and failover for application instances. This part should be selected and configured by the team's O&M personnel according to their needs.

## Deployment Steps

### Infrastructure Preparation

#### Load Balancing

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

#### Redis Service

In the cluster's internal network (or k8s), start a Redis service. Alternatively, enable a separate Redis service for each function (cache, synchronization signals, message queue, and distributed lock).

#### Local Storage (As needed)

If local storage is used, in a multi-node mode, you should mount a cloud disk as the local storage directory to support shared access across multiple nodes. Otherwise, local storage will not be automatically synchronized and will not function properly.

If not using local storage, after the application starts, you need to set the cloud-based file storage space as the default file storage space and migrate the application's Logo (or other files) to the cloud storage space.

### Required Plugin Preparation

| Function | Plugin |
| --- | --- |
| Cache | Built-in |
| Synchronization Signal | @nocobase/plugin-pubsub-adapter-redis |
| Message Queue | @nocobase/plugin-queue-adapter-redis |
| Distributed Lock | @nocobase/plugin-lock-adapter-redis |

:::info{title=Tip}
Just like in single-node mode, as long as the environment variables related to the commercial plugin service platform are configured, the application will automatically download the corresponding plugins upon startup.
:::

### Environment Variable Configuration

In addition to the basic environment variables, the following environment variables must be configured on all nodes and must be consistent.

#### Application Key

The key used to create JWT tokens for user login. It is recommended to use a random string.

```ini
APP_KEY=
```

#### Multi-core Mode

```ini
# Enable PM2 multi-core mode
# CLUSTER_MODE=max # Disabled by default, requires manual configuration
```

#### Cache

```ini
# Cache adapter. In cluster mode, it needs to be set to redis (defaults to in-memory if left blank)
CACHE_DEFAULT_STORE=redis

# Redis cache adapter connection URL, needs to be filled in actively
CACHE_REDIS_URL=
```

#### Synchronization Signal

```ini
# Redis sync adapter connection URL, defaults to redis://localhost:6379/0 if left blank
PUBSUB_ADAPTER_REDIS_URL=
```

#### Distributed Lock

```ini
# Lock adapter. In cluster mode, it needs to be set to redis (defaults to in-memory local lock if left blank)
LOCK_ADAPTER_DEFAULT=redis

# Redis lock adapter connection URL, defaults to redis://localhost:6379/0 if left blank
LOCK_ADAPTER_REDIS_URL=
```

#### Message Queue

```ini
# Enable Redis as the message queue adapter, defaults to in-memory adapter if left blank
QUEUE_ADAPTER=redis
# Redis message queue adapter connection URL, defaults to redis://localhost:6379/0 if left blank
QUEUE_ADAPTER_REDIS_URL=
```

:::info{title=Tip}
Usually, the related adapters can all use the same Redis instance, but it is best to use different databases to avoid potential key conflict issues, for example:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
```
:::

#### Enabling Built-in Plugins

```ini
# Built-in plugins to enable
APPEND_PRESET_BUILT_IN_PLUGINS=lock-adapter-redis,pubsub-adapter-redis,queue-adapter-redis
```

### Starting the Application

When starting the application for the first time, you should start one of the nodes first. After the plugins are installed and enabled, you can then start the other nodes.

## Upgrading or Maintenance

When you need to upgrade the NocoBase version or enable/disable plugins, follow this process.

:::warning{title=Note}
In a cluster production environment, be cautious or prohibit the use of functions like plugin management and version upgrades.

NocoBase does not yet support online upgrades for cluster versions. To ensure data consistency, the service needs to be suspended during the upgrade process.
:::

### Stop the Current Service

Stop all NocoBase application instances, middleware like Redis, and forward the load balancer's traffic to a 503 status page.

### Back Up Data

Before upgrading, it is strongly recommended to back up the database to prevent any issues during the upgrade process.

### Update Version

Refer to [Docker Upgrade](../get-started/upgrading/docker) to update the version of the NocoBase application image.

### Start the Service

1. Restart the dependent middleware (Redis)
2. Start one node in the cluster, wait for the update to complete and for it to start successfully
3. Verify that the functionality is correct. If there are any issues that cannot be resolved, you can roll back to the previous version
4. Start the other nodes
5. Transfer the load balancer's traffic to the application cluster

## More References

This document only introduces the basic concepts and deployment steps of NocoBase cluster mode. For more configuration options and specific scenarios, you can refer to the following documents:

- [Service Splitting](./services-splitting.md)
<!-- - [Kubernetes 部署](./kubernetes.md) -->