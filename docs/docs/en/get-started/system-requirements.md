# System Requirements

The system requirements described in this document apply **only to the NocoBase application service itself**, and cover the compute and memory resources required by the application processes. They **do not cover dependent third-party services**, including but not limited to:

- API gateways / reverse proxies
- Database services (for example, MySQL or PostgreSQL)
- Cache services (for example, Redis)
- Middleware such as message queues or object storage

Except for functionality validation or purely experimental scenarios, **we strongly recommend deploying the above third-party services separately** on dedicated servers or containers, or by using the corresponding cloud services.

The system configuration and capacity planning of those services must be evaluated and tuned separately based on the **actual data size, workload, and concurrency level**.

## Single-Node Deployment Mode

Single-node deployment mode means the NocoBase application service runs on a single server or container instance.

### Minimum Hardware Requirements

| Resource | Requirement |
| --- | --- |
| CPU | 1 core |
| Memory | 2 GB |

**Applicable scenarios:**

- Micro businesses
- Proof of concept (POC)
- Development / testing environments
- Scenarios with almost no concurrent access

:::info{title=Tips}

- This specification only ensures that the system can run; it does not guarantee performance.
- As the data size or concurrent requests grow, system resources may quickly become a bottleneck.
- For **source code development, plugin development, or building and deploying from source**, reserve **at least 4 GB of free memory** to make sure dependency installation, compilation, and build steps complete successfully.

:::

### Recommended Hardware Requirements

| Resource | Recommended Spec |
| --- | --- |
| CPU | 2 cores |
| Memory | ≥ 4 GB |

**Applicable scenarios:**

Suitable for small to medium workloads with limited concurrency in production environments.

:::info{title=Tips}

- With this configuration, the system can handle routine admin operations and lightweight business workloads.
- When business complexity, concurrent access, or background tasks grow, consider upgrading the hardware specification or migrating to cluster mode.

:::

## Cluster Mode

Cluster mode is designed for medium to large workloads with higher concurrency. You can scale horizontally to improve availability and throughput (see [Cluster Mode](/cluster-mode) for details).

### Node Hardware Requirements

In cluster mode, the recommended hardware configuration for each application node (Pod / instance) is identical to the single-node deployment mode.

**Minimum per-node configuration:**

- CPU: 1 core
- Memory: 2 GB

**Recommended per-node configuration:**

- CPU: 2 cores
- Memory: 4 GB

### Planning the Number of Nodes

- Scale the number of nodes as needed (2–N).
- The actual number of nodes depends on:
  - Concurrent traffic
  - Business logic complexity
  - Background jobs and asynchronous workloads
  - Responsiveness of external dependencies

Recommendations for production environments:

- Adjust the node count dynamically based on monitoring metrics (CPU, memory, request latency, and so on).
- Reserve a resource buffer to handle traffic spikes.
