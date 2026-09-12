---
title: "Environment Management"
description: "The Environment Management Skill handles NocoBase application installation, upgrades, stopping, starting, and multi-environment management, such as development, testing, and production environments — from 'NocoBase isn't installed yet' to 'ready to log in and use.'"
keywords: "AI Builder,environment management,installation,upgrade,Docker"
---

# Environment Management

:::tip Prerequisites

Before reading this page, make sure you have installed the NocoBase CLI and completed initialization as described in [AI Builder Quick Start](./index.md).

:::

## Introduction

The Environment Management Skill handles NocoBase application installation, upgrades, stopping, starting, and multi-environment management, such as development, testing, and production environments — from "NocoBase isn't installed yet" to "ready to log in and use."


## Capabilities

- Query NocoBase environment and status
- Add, remove, and switch NocoBase instance environments
- Install, upgrade, stop, and start NocoBase instances


## Prompt Examples

### Scenario A: Environment status query
Prompt mode
```
What NocoBase instances do I have? Which environment am I currently in?
```
CLI mode
```
nb env list
```

### Scenario B: Adding an existing environment
:::tip Prerequisites

Requires an existing NocoBase instance, either local or remote

:::

Prompt mode
```
Help me add a dev environment at http://localhost:13000
```
CLI mode
```
nb env add <dev> --base-url http://localhost:13000/api
```
### Scenario C: Installing a new NocoBase instance
:::tip Prerequisites

The quickest way to install NocoBase is using Docker mode. Make sure you have Node, Docker, and Yarn installed on your machine before proceeding.

:::

Prompt mode
```
Help me install NocoBase
```
CLI mode
```
nb init --ui
```

### Scenario D: Instance upgrade

Prompt mode
```
Help me upgrade the current instance to the latest version
```
CLI mode
```
nb app upgrade
```

### Scenario E: Stopping an instance

Prompt mode
```
Help me stop the current instance
```
CLI mode
```
nb app stop
```

### Scenario E: Starting an instance

Prompt mode
```
Help me start the current instance
```
CLI mode
```
nb app start
```

## FAQ

**What should I do if AI Builder capabilities are not available after installation?**

Currently, all AI Builder capabilities are in the alpha image. Check whether you installed using this image. If not, you can upgrade to this image.

**What should I do if Docker reports a port conflict on startup?**

Use a different port (e.g., `port=14000`), or stop the process occupying port 13000 first. The Skill's pre-check phase will proactively flag port conflicts.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [NocoBase CLI](../ai/quick-start.md) — Command-line tool for installing and managing NocoBase
