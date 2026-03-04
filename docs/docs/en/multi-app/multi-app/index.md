---
pkg: '@nocobase/plugin-app-supervisor'
---

# Multi-app Management

## Overview

Multi-app management is a unified application management solution provided by NocoBase for creating and managing multiple physically isolated NocoBase application instances in one or more runtime environments. Through the AppSupervisor, users can create and maintain multiple applications from a unified entry point to meet the needs of different businesses and scale stages.

## Single App

In the early stages of a project, most users start with a single app.

In this mode, only one NocoBase instance needs to be deployed, and all business functions, data, and users run in the same application. It is easy to deploy and has low configuration costs, making it ideal for prototyping, small projects, or internal tools.

However, as the business becomes more complex, a single application faces some natural limitations:

- Features keep accumulating, making the system bloated
- Difficult to isolate different businesses
- The cost of application expansion and maintenance continues to rise

At this point, users will want to split different businesses into multiple applications to improve system maintainability and scalability.

## Shared Memory Multi-app

When users want to split their business but do not want to introduce complex deployment and maintenance architectures, they can upgrade to the shared memory multi-app mode.

In this mode, multiple applications can run simultaneously in one NocoBase instance. Each application is independent, can connect to an independent database, and can be created, started, and stopped individually, but they share the same process and memory space. Users still only need to maintain one NocoBase instance.

![](https://static-docs.nocobase.com/202512231055907.png)

This approach brings significant improvements:

- Business can be split by application dimension
- Functions and configurations between applications are clearer
- Lower resource consumption compared to multi-process or multi-container solutions

However, since all applications run in the same process, they share resources such as CPU and memory. An anomaly or high load in a single application may affect the stability of other applications.

When the number of applications continues to increase, or when higher requirements for isolation and stability are raised, the architecture needs to be further upgraded.

## Multi-environment Hybrid Deployment

When the business scale and complexity reach a certain level and the number of applications needs to be expanded at scale, the shared memory multi-app mode will face challenges such as resource contention, stability, and security. In the scaling phase, users can consider adopting a multi-environment hybrid deployment to support more complex business scenarios.

The core of this architecture is the introduction of an entry application, i.e., deploying one NocoBase as a unified management center, while deploying multiple NocoBase instances as application runtime environments for actually running business applications.

The entry application is responsible for:

- Application creation, configuration, and lifecycle management
- Dispatching management commands and status aggregation

The instance application environment is responsible for:

- Actually hosting and running business applications through the shared memory multi-app mode

For users, multiple applications can still be created and managed through a single entry point, but internally:

- Different applications can run on different nodes or clusters
- Each application can use independent databases and middleware
- High-load applications can be expanded or isolated as needed

![](https://static-docs.nocobase.com/202512231215186.png)

This approach is suitable for SaaS platforms, large numbers of demo environments, or multi-tenant scenarios, improving system stability and maintainability while ensuring flexibility.