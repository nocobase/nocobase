---
name: nocobase-app-plugin-concurrency-redis
description: Configure the application-owned Redis concurrency implementation and inspect native lease behavior and dedicated connection ownership.
---

# Redis concurrency integration

Before installing or configuring the plugin, read [Installation and version selection](references/installation.md). This public Skill can be installed without the commercial runtime package.

Register the original OSS concurrency Server plugin before the Redis Server plugin. Import both from their public /server entries. The Redis Provider registers an implementation with the original concurrencyServiceToken during register; it owns neither another Token nor another application service.

Use the application's concurrency configuration section with adapter redis, an explicit namespace and a standalone connection object. Host, port, db, username, password, finite connectTimeout/commandTimeout and verified TLS are supported. Do not share another service's active Redis client, add Cluster/Sentinel fields or silently fall back to local locks.

Obtain the manager with the original service's getManager(configKey?) after startup. Lock and Executor names share the same physical resource for the same namespace and Redis database, independent of configuration name and TTL. TTL is a renewable lease duration mapped to native lockTimeout; resource TTL overrides configuration TTL, otherwise the native default is used. Native automatic renewal is shared by manual leases and Executors. Manual release is explicit; Executor release waits for the no-argument runner to settle. There is no execution signal or TTL-based result verdict.

Acquisition cancellation applies only before delivery. A late confirmed acquisition is released using its own native Mutex. Unknown SET outcomes may leave a Redis entry until expiry. Shutdown aborts waits, observes native completion, releases confirmed leases and closes only the dedicated connection. Stop dependent business work first. Do not restart an application or change production Redis configuration merely to inspect this plugin.

Verify through the target application against an isolated task-owned Redis: two instances contend for one resource, the holder releases it, an interrupted waiter does not acquire it, and shutdown closes owned connections. Run the application's scoped checks and production build. Commercial repository test scripts are optional maintainer tools, not installation prerequisites.
