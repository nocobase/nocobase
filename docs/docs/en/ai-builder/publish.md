---
title: "Release Management"
description: "The Release Management Skill performs auditable release operations across multiple environments."
keywords: "AI Builder,release management,cross-environment release,backup restore,migration,rollback"
---

# Release Management

## Introduction

The Release Management Skill performs auditable release operations across multiple environments — supporting both backup & restore (`backup_restore`) and migration (`migration`) release methods, with strict validation logic at every key step.

## Installation

```bash
npx skills add nocobase/skills --skill nocobase-publish-manage -y
```

## Capabilities

- Pre-release checks: Verify source and target environment status and required plugin readiness
- Cross-environment releases: Support both backup & restore and migration methods
- Post-release validation: Automatically verify release results
- Exception rollback: Roll back to the pre-release state using backup packages
- Auditable execution: Every step is annotated with context for easy review

## Prompt Examples

### Scenario A: Releasing to a different environment

```
Release from the development environment to the testing environment
```

It will ask about the release method and strategy. Release methods include backup release and fresh release, and the release strategy offers 4 preset combinations.

### Scenario B: Migration release

```
Migrate the development environment to the testing environment
```

![Migration release](https://static-docs.nocobase.com/20260417151022.png)

### Scenario C: Backup restore

```
Restore the testing environment from a development environment backup
```

![Backup restore](https://static-docs.nocobase.com/20260417150854.png)

## FAQ

**Should I choose backup & restore or migration?**

If you already have a usable backup package, choose `backup_restore`. If you need to control which data gets synced by strategy (e.g., syncing only the structure without data), choose `migration`.

**What does "migration plugin not found" mean?**

The migration management plugin requires the Professional edition or above. See [NocoBase Commercial Edition](https://www.nocobase.com/en/commercial) for details.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [Installation & Upgrade](./env-bootstrap) — Environment checks, installation, deployment, and troubleshooting
