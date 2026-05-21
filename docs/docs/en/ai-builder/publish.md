---
title: "Release Management"
description: "The Release Management Skill performs auditable release operations across multiple environments, supporting backup restore and migration."
keywords: "AI Builder,release management,cross-environment release,backup restore,migration"
---

# Release Management

:::tip Prerequisites

- Before reading this page, install the NocoBase CLI and complete initialization as described in [AI Builder Quick Start](./index.md)
- Requires a Professional edition or above license. See [NocoBase Commercial Edition](https://www.nocobase.com/en/commercial)
- Enable the Backup Management and Migration Management plugins, and upgrade them to the latest version

:::

## Introduction

The Release Management Skill performs release operations between multiple NocoBase environments. It supports two approaches: backup restore and migration.

If you only want to fully overwrite one environment with another, backup restore is usually enough. If you need to control what gets synchronized by rules, such as syncing only the structure without business data, migration is more suitable.

## Capabilities

- Single-environment backup restore: restore the current environment using an existing backup package
- Single-environment instant backup restore: create a backup of the current environment first, then restore the current environment with it
- Cross-environment backup restore: restore a backup package from the source environment to the target environment
- Cross-environment migration: update the target environment incrementally with a migration package

## Prompt Examples

### Scenario A: Single-environment backup restore with a specified file

:::tip Prerequisites

A backup file with the same name must already exist in the current environment.

:::

```text
Restore using <file-name.nbdata> backup
```

The Skill uses the backup file with the same name that already exists on the current environment server for restore.

### Scenario B: Single-environment backup restore without specifying a file

```text
Back up and restore the current environment
```

The Skill first creates a backup of the current environment, then restores the current environment with that backup.

### Scenario C: Cross-environment backup restore

:::tip Prerequisites

Prepare two environments, such as a local dev environment and a remote test environment, or two local environments. You can specify a backup file or leave it unspecified.

:::

```text
Restore dev to test
```

The Skill creates a backup package in the dev environment, then restores that backup package to the test environment.

### Scenario D: Cross-environment migration

:::tip Prerequisites

Similar to Scenario C, prepare two environments. You can specify a migration file or leave it unspecified.

:::

```text
Migrate dev to test
```

The Skill creates a migration package in the dev environment, then uses that migration package to update the test environment.

## FAQ

**Should I choose backup restore or migration?**

Backup restore is the default choice, especially if you already have a usable backup package or want the target environment to be fully overwritten with the source environment state. Use migration only when you need to control the synchronization scope by rules, such as syncing only the structure without data.

**What does it mean if the migration plugin is missing?**

The Migration Management plugin requires a Professional edition or above license. See [NocoBase Commercial Edition](https://www.nocobase.com/en/commercial) for details.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [Environment Management](./env-bootstrap) — Environment checks, installation, deployment, and troubleshooting
