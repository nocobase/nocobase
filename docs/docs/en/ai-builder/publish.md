---
title: "Release Management"
description: "The Release Management Skill performs release operations across multiple environments."
keywords: "AI Builder,release management,cross-environment release,backup restore,migration"
---

# Release Management

:::tip Prerequisites

- Before reading this page, make sure you have installed the NocoBase CLI and completed initialization as described in [AI Builder Quick Start](./index.md).
- Requires Professional edition or above authorization from [NocoBase Commercial Edition](https://www.nocobase.com/en/commercial).
- Make sure the Backup Management and Migration Management plugins are activated and upgraded to the latest version.

:::

:::warning Note
The Release Management CLI is still under active development and is not yet available for use.
:::
## Introduction

The Release Management Skill performs release operations across multiple environments — supporting both backup & restore and migration release methods.


## Capabilities

- Single-environment backup & restore: Use a backup package to fully restore data on the local machine.
- Cross-environment backup & restore: Use a backup package to fully restore data on the target environment.
- Cross-environment migration: Use a new migration package to differentially update data on the target environment.

## Prompt Examples

### Scenario A: Single-environment backup & restore
:::tip Prerequisites

The current environment needs to have a backup package, or you need to create a backup first and then restore.

:::

Prompt mode
```
Restore using <file-name> backup
```
CLI mode
```
// Check which backup packages are available; if none, run nb backup <file-name>
nb backup list
nb restore <file-name>
```
![Backup restore](https://static-docs.nocobase.com/20260417150854.png)

### Scenario B: Cross-environment backup & restore

:::tip Prerequisites

You need two environments, such as a local dev environment and a remote test environment, or two locally installed environments.

:::

Prompt mode
```
Restore dev to test
```
CLI mode
```
// Check which backup packages are available; if none, run nb backup <file-name> --env dev
nb backup list --env dev
// Use the backup package to restore
nb restore <file-name> --env test
```
![Backup restore](https://static-docs.nocobase.com/20260417150854.png)

### Scenario C: Cross-environment migration

:::tip Prerequisites

Similar to Scenario B, you need two environments, such as a local dev environment and a remote test environment, or two locally installed environments.

:::

Prompt mode
```
Migrate dev to test
```
CLI mode
```
// Create a migration rule, which produces a new ruleId, or use nb migration rule list --env dev to get a historical ruleId
nb migration rule add --env dev
// Use the ruleId to generate a migration package
nb migration generate <ruleId> --env dev
// Use the migration package to migrate
nb migration run <file-name> --env test
```
![Migration release](https://static-docs.nocobase.com/20260417151022.png)

## FAQ

**Should I choose backup & restore or migration?**

If you already have a usable backup package, choose backup & restore. If you need to control which data gets synced by strategy (e.g., syncing only the structure without data), choose migration.

**What does "migration plugin not found" mean?**

The migration management plugin requires the Professional edition or above. See [NocoBase Commercial Edition](https://www.nocobase.com/en/commercial) for details.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [Environment Management](./env-bootstrap) — Environment checks, installation, deployment, and troubleshooting
