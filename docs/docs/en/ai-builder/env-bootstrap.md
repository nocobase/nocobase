---
title: "Installation & Upgrade"
description: "The Installation & Upgrade Skill handles NocoBase environment checks, installation, deployment, upgrades, and troubleshooting."
keywords: "AI Builder,installation upgrade,installation,deployment,upgrade,diagnostics,Docker"
---

# Installation & Upgrade

## Introduction

The Installation & Upgrade Skill handles NocoBase environment checks, installation, deployment, upgrades, and troubleshooting — from "NocoBase isn't installed yet" to "ready to log in and use," while maintaining the CLI runtime environment.

## Installation

```bash
npx skills add nocobase/skills --skill nocobase-env-bootstrap -y
```

## Capabilities

- Environment pre-checks: Automatically detect dependencies, ports, network, and paths
- Installation & deployment: Support Docker, create-nocobase-app, and Git methods
- Single-instance upgrades: Safe upgrade process with backup confirmation and version verification
- Troubleshooting: Collect diagnostic information and provide minimal fix solutions based on common issues
- CLI environment management: Add, switch, and view application environment configurations

## Prompt Examples

### Scenario A: Quick installation

```
Help me install NocoBase using Docker on port 13000
```

The Skill will run environment pre-checks first, then install and start using the Docker workflow, and finally provide the login URL and default account.

### Scenario B: Upgrading an instance

```
Upgrade the current instance to the latest version
```

It will require backup status confirmation before proceeding with the upgrade. After completion, it automatically runs an availability check.

### Scenario C: Troubleshooting

```
The application failed to start, help me diagnose the issue
```

It will collect logs and environment information, identify common issues (port conflicts, insufficient permissions, missing dependencies, etc.) and provide fix solutions.

### Scenario D: Adding an environment

```
Help me add a development environment at http://localhost:13000/
```

## FAQ

**What should I do if AI Builder capabilities are not available after installation?**

Currently, all AI Builder capabilities are in the alpha image. Check whether you installed using this image. If not, you can upgrade to this image.

**What should I do if Docker reports a port conflict on startup?**

Use a different port (e.g., `port=14000`), or stop the process occupying port 13000 first. The Skill's pre-check phase will proactively flag port conflicts.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [NocoBase CLI](../get-started/nocobase-cli.md) — Command-line tool for installing and managing NocoBase
- [Release Management](./publish) — Migrate and release configurations across environments
