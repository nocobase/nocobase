---
name: nocobase-app-plugin-distributed
description: Configure or diagnose multi-instance NocoBase 3 applications, including shared Redis caching, concurrency, Jobs, Queue and Realtime. Use for horizontal scaling, cross-instance coordination and distributed backend rollout. Not for creating an application, implementing Redis adapters, or deploying a single-instance application without a scaling requirement.
---

# Distributed applications

This package provides guidance only. It has no runtime exports, configuration section, UI or automatically registered adapters. Do not add a `distributed` section to `config.yml` or register this package in a runtime plugin list. A synchronized Skill is not evidence that an application is distributed.

## Inspect the application first

Read the application's `AGENTS.md`, installed deployment Skill and the compatible Skills for the services being changed. Inspect `package.json`, the lockfile, `server/plugins.ts`, configuration factories, `config.yml`, environment mappings, file storage and deployment topology. Use the installed versions' public declarations and documentation; a source checkout is not required.

Record each service's effective selector, adapter, shared destination, namespace and overrides without exposing credentials. Distinguish a dependency being installed, a Server plugin being registered, a backend being selected, and successful cross-instance verification. Inspect named backends selected by business code as well as the default. Do not assume every application needs every Redis plugin.

## Configure and verify

1. Establish the intended instance count, public origin and shared infrastructure. Inventory existing persistent data, active jobs, queues and file storage before planning a switch. Follow [shared infrastructure and rollout](references/rollout.md).
2. Map each required service to its configuration and implementation using [backend configuration](references/backends.md). Keep unused services unchanged and preserve application-owned custom providers.
3. Resolve compatible runtime packages and commercial access before selecting their adapters. Use the target application's commercial-package access instructions and existing credentials. If unavailable, distinguish access denial, missing version and network failure, report the gap and continue independent preparation. Never substitute memory and call the application distributed.
4. Install required packages and explicitly register their supported Server exports. Read each package's own Skill and typed configuration before editing its settings. Merge changes into existing application configuration; do not replace unrelated sections or expose connection credentials in browser configuration.
5. Run the application's configuration validation, scoped checks and build. Configuration validation alone does not prove connectivity, plugin activation or distributed behavior. Start an isolated two-instance verification using shared infrastructure and verify the relevant operations in [the rollout checklist](references/rollout.md).
6. Report what changed, effective service selections, verification evidence and remaining blockers. Scale production only within the user's authorization, after the applicable verification succeeds.

## Ownership and limits

The application owns its configuration, Server composition, business operations, deployment manifests and access rules. Each runtime plugin owns its public adapters and connection lifecycle. This plugin owns only this Skill and its references. Edit these sources when maintaining the plugin, never the application's generated Skill copies.

Use original service Tokens and registered public APIs. Distributed coordination does not expand user permissions, make application side effects exactly-once, migrate in-memory work to Redis, or make local files shared. Read the owning plugin's supported topology and failure semantics; do not promise Cluster or Sentinel support without version-specific evidence.
