# Cluster Mode

## Introduction

Starting from v1.6.0, NocoBase supports running applications in cluster mode. When an application runs in cluster mode, it can improve its performance in handling concurrent access by using multiple instances and a multi-core mode.

Based on cluster mode, you can achieve application-level high availability: traffic is distributed by a load balancer across multiple NocoBase instances within the same cluster, so if a single instance fails, restarts, or is being released, other instances can continue serving traffic. In practice, a single cluster should usually be deployed within the same low-latency network environment.

It is important to note that NocoBase cluster mode addresses horizontal scaling and high availability of application instances at the application layer. If you need warm standby or disaster recovery across availability zones or regions, you would typically deploy multiple independent clusters, and the operations team would be responsible for the data replication and switchover strategy for the database, shared storage, and other infrastructure.

## System Architecture


![20251031221530](https://static-docs.nocobase.com/20251031221530.png)


*   **Application Cluster**: A cluster composed of multiple NocoBase application instances. It can be deployed on multiple servers or run as multiple processes in multi-core mode on a single server.
*   **Database**: Stores the application's data. It can be a single-node or a distributed database.
*   **Shared Storage**: Used to store application files and data, supporting read/write access from multiple instances.
*   **Middleware**: Includes components like cache, synchronization signals, message queue, and distributed locks to support communication and coordination within the application cluster.
*   **Load Balancer**: Responsible for distributing client requests to different instances in the application cluster, as well as performing health checks and failover.

## Learn More

This document only introduces the basic concepts and components of NocoBase's cluster mode. For specific deployment details and more configuration options, please refer to the following documents:

- Deployment
  - [Preparations](./preparations)
  - [Kubernetes Deployment](./kubernetes)
  - [Operations](./operations)
- Advanced
  - [Service Splitting](./services-splitting)
- [Development Reference](./development)
