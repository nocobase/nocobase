---
title: "Version Control"
description: "The Version Control Skill (nocobase-revision) creates restorable application versions after AI Builder completes milestone work."
keywords: "AI Builder,version control,nocobase-revision,nb revision create,restore version"
---

# Version Control

:::tip Prerequisites

- Before reading this page, install the NocoBase CLI and complete initialization as described in [AI Builder Quick Start](./index.md)
- Enable the Backup Management and Version Control plugins
- Community and Standard editions do not include the Version Control plugin. If you only need a rollback point before key changes, use [Backup Management](../ops-management/backup-manager/index.mdx)

:::

## Introduction

The Version Control Skill (`nocobase-revision`) creates a restorable application version after AI Builder completes a meaningful milestone. For example, after building a page, creating a group of collections, or configuring a workflow, AI can run `nb revision create` to save the current state.

It does not create a version for every field change. By default, it saves only after a clear milestone is completed and verified, so the version list stays readable and rollback points are easier to choose.

For version lists, manual version creation, restore operations, and retention settings, see the [Version Control plugin guide](../ops-management/version-control/index.md).

## Capabilities

Can do:

- Create a version after a building milestone is completed and verified
- Write a concise description that explains what was saved
- Create versions using the current CLI environment

Cannot do:

- Replace the underlying save and restore capabilities of the Backup Management plugin
- Create versions when the Version Control plugin is not enabled
- Restore to a version automatically. Use the [Version Control plugin](../ops-management/version-control/index.md) to restore versions

## Prompt Examples

### Scenario A: Save a completed page configuration

```text
Save the current build as a version: completed customer management page, filter area, and edit form configuration
```

The Skill turns the description into a concise version note and creates a version.

Command mode:

```bash
nb revision create "Completed customer management page, filter area, and edit form configuration"
```

### Scenario B: Save data model and workflow milestones

```text
The supplier collections and purchase approval workflow have been verified. Create a version for me.
```

This fits work that spans multiple capabilities. For example, create collections with [Data Modeling](./data-modeling), configure an approval process with [Workflow Management](./workflow), verify the result, then save a version.

### Scenario C: Create a version in a specified environment

```text
In the dev environment, save a version: completed ticket management page and SLA field configuration
```

If the specified environment is not the current CLI environment, the Skill confirms the target environment first to avoid saving the version to the wrong application.

Command mode:

```bash
nb revision create --env dev --yes "Completed ticket management page and SLA field configuration"
```

## How to Write Version Descriptions

A version description should say what has been completed, not just use a vague label.

Recommended:

- `Completed customer ledger, detail page, and approval submission flow`
- `Completed supplier collections, purchase request form, and approval workflow`
- `完成客户台账、详情页与审批提交流程配置`

Not recommended:

- `snapshot`
- `backup`
- `test`
- `version 2`
- Date or timestamp only

Also, do not include tokens, URLs, passwords, or other sensitive information. Descriptions appear in the version list and should stay clear, readable, and auditable.

## FAQ

**When should I create a version?**

Create one after a milestone that can be reviewed on its own. For example, a page opens and edits correctly, collection relationships have been verified, or a workflow has been saved and its node chain checked.

**Why not create a version after every AI adjustment?**

Too many tiny versions quickly make the list hard to read. A version should usually represent a point you can restore to and continue working from, not a single field rename or button position change.

**Should the result be verified before creating a version?**

Yes. The Version Control Skill is for saving completed and verified work. If a page still errors or a workflow is not confirmed, ask AI to fix and verify it before creating a version.

**Where do I restore a version after it is created?**

Restore it in the version list of the Version Control plugin. Restoring overwrites the current application configuration and the data included in that version. Read the [Version Control plugin guide](../ops-management/version-control/index.md) before operating.

## Related Links

- [Version Control plugin guide](../ops-management/version-control/index.md) — manually create versions, restore versions, and configure version rules
- [Backup Management](../ops-management/backup-manager/index.mdx) — the underlying capability required by Version Control
- [AI Builder Overview](./index.md) — overview and installation guide for all AI Builder Skills
- [Release Management](./publish.md) — cross-environment releases, backup restore, and migration
