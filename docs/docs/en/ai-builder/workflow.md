---
title: "Workflow Management"
description: "The Workflow Management Skill creates, edits, enables, and diagnoses NocoBase workflows."
keywords: "AI Builder,workflow,triggers,nodes,approval,automation"
---

# Workflow Management

## Introduction

The Workflow Management Skill creates, edits, enables, and diagnoses NocoBase workflows — from trigger selection to node chain building to execution result troubleshooting, covering the complete workflow lifecycle.

## Installation

```bash
npx skills add nocobase/skills --skill nocobase-workflow-manage -y
```

## Capabilities

Can do:

- Create workflows: Select trigger types and add processing nodes one by one
- Edit workflows: Modify trigger configuration, add/remove/update nodes, move and copy nodes
- Version management: Versions that have been executed will automatically create a new revision without affecting historical records
- Enable and manually execute workflows
- Diagnose failed executions: Locate failed nodes and error messages

Cannot do:

- Cannot design data models (use the [Data Modeling Skill](./data-modeling))
- Cannot install MCP or handle environment issues (use the [Installation & Upgrade Skill](./env-bootstrap))
- Cannot delete an entire workflow (a high-risk operation requiring separate confirmation)
- Cannot fabricate node types or trigger types

## Prompt Examples

### Scenario A: Creating a new workflow

```
Help me set up a workflow that automatically deducts product inventory after an order is created
```

The Skill will first confirm the trigger type and node chain design, then create them step by step after confirmation.

### Scenario B: Editing an existing workflow

```
In the shipping notification workflow, add an update inventory node after the approval passes
```

If the current version has been executed, a new revision will be created first before editing, without affecting historical execution records.

### Scenario C: Diagnosing execution failures

```
The shipping notification workflow failed on its last execution, help me find out what went wrong
```

It will find the most recent failed execution, locate the failed node and error message, and provide fix recommendations.

### Scenario D: Analyzing or summarizing workflow logic

```
Help me analyze the processing logic of the "order creation inventory deduction" workflow
```

## FAQ

**Why isn't the workflow triggering after creation?**

Newly created workflows are disabled by default (`enabled: false`). You need to confirm the trigger configuration is correct before manually enabling it.

**Will editing a workflow affect historical execution records?**

No. If the current version already has execution records, the Skill will automatically create a new revision. Historical execution records are bound to the old version and are not affected.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [Data Modeling](./data-modeling) — Create and manage data tables with AI
- [Installation & Upgrade](./env-bootstrap) — Environment checks, installation, deployment, and troubleshooting
