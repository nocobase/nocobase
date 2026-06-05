---
pkg: '@nocobase/plugin-app-supervisor'
---

# Multi-Application Management

## Overview

Multi-application management is a unified application management solution provided by NocoBase. It allows you to create and manage multiple **physically isolated** NocoBase application instances across one or more runtime environments. With **AppSupervisor**, users can create and maintain multiple applications from a single entry point, supporting different business needs and growth stages.

## Single Application

At the early stage of a project, most users start with a single application.

In this mode, only one NocoBase instance is deployed. All business logic, data, and users run within the same application. Deployment is simple and configuration cost is low, making it ideal for prototyping, small projects, or internal tools.

As the business grows, a single application naturally faces limitations:

- Features keep accumulating, making the system bloated
- Business domains are difficult to isolate
- Scaling and maintenance costs continue to rise

At this point, users typically want to split different businesses into multiple applications to improve maintainability and scalability.

## Shared-Memory Multi-Application

When users want to split business domains without introducing complex deployment and operations, they can upgrade to the shared-memory multi-application mode.

In this mode, multiple applications run within a single NocoBase instance. Each application is independent, can connect to its own database, and can be created, started, or stopped independently. However, they share the same process and memory space, so users still maintain only one NocoBase instance.

![](https://static-docs.nocobase.com/202512231055907.png)

This approach brings clear improvements:

- Business can be split at the application level
- Application features and configurations are more explicit
- Lower resource overhead compared to multi-process or multi-container setups

However, since all applications run in the same process, they share CPU and memory. High load or failures in one application may affect the stability of others.

As the number of applications grows, or when stronger isolation and stability are required, the architecture needs to evolve further.

## Multi-Environment Hybrid Deployment

When business scale and complexity increase and applications need to grow at scale, the shared-memory model faces challenges such as resource contention, stability, and security. At this stage, a **multi-environment hybrid deployment** can be adopted to support more complex scenarios.

The core of this architecture is introducing an **entry application**: one NocoBase instance acts as a unified control plane, while multiple NocoBase instances are deployed as application runtime environments that actually host business applications.

The entry application is responsible for:

- Application creation, configuration, and lifecycle management
- Dispatching management commands and aggregating status

Runtime application environments are responsible for:

- Hosting and running business applications using the shared-memory multi-application model

From the user’s perspective, applications are still created and managed through a single entry point. Internally:

- Different applications can run on different nodes or clusters
- Each application can use its own database and middleware
- High-load applications can be isolated or scaled independently

![](https://static-docs.nocobase.com/202512231215186.png)

This model is well suited for SaaS platforms, large numbers of demo environments, and multi-tenant scenarios, improving stability and operability while preserving flexibility.
