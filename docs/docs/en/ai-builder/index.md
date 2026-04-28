---
title: "AI Builder Quick Start"
description: "AI Builder is NocoBase's AI-assisted building capability. Through natural language, you can perform data modeling, UI configuration, workflow orchestration, and more, providing a more modern and efficient building experience."
keywords: "AI Builder,NocoBase AI,Agent Skills,natural language building,low-code AI,quick start"
---

# AI Builder Quick Start

AI Builder is NocoBase's AI-assisted building capability — you can describe your requirements in natural language, and the AI will automatically handle data modeling, page configuration, permission setup, and more. It provides a more modern and efficient building experience.

## Quick Start

If you have already installed the [NocoBase CLI](../ai/quick-start.md), you can skip this step.

### One-Click AI Installation

Copy the following prompt to your AI assistant (Claude Code, Codex, Cursor, Trae, etc.) to automatically complete the installation and configuration:

```
Help me install NocoBase CLI and complete initialization: https://docs.nocobase.com/ai/ai-quick-start.md (please read the linked content directly)
```

### Manual Installation

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
```

Your browser will automatically open a visual configuration page that guides you through installing NocoBase Skills, configuring the database, and starting the application. For detailed steps, see [Quick Start](../ai/quick-start.md).

## From a Single Sentence to a Complete System

After installation, you can use natural language to operate NocoBase directly from your AI assistant. Here are a few real-world scenarios, from creating a single table to building an entire system, to give you a feel for AI Builder's capabilities.

### Describe Your Business Requirements, AI Designs Tables and Relationships

Tell the AI what kind of system you want to build, and it will automatically design data tables, field types, and relationships for you — no need to draw ER diagrams yourself.

```
I'm building a CRM, please help me design and build the data model
```

![AI designs CRM data model](https://static-docs.nocobase.com/202604162126729.png)

The AI automatically generated data tables for customers, contacts, opportunities, orders, and their relationships:

![CRM data model result](https://static-docs.nocobase.com/202604162201867.png)

To learn more about data modeling, see [Data Modeling](./data-modeling).

### Describe Pages in Business Language, AI Builds Them

No need to learn configuration rules — just say what kind of page you want. Search boxes, tables, filters — just describe them and they're done.

```
Help me create a customer management page with a name search box and a customer table showing name, phone, email, and creation time
```

![Customer management page](https://static-docs.nocobase.com/20260420100608.png)

To learn more about UI configuration, see [UI Configuration](./ui-builder).

### Orchestrate Automated Workflows with One Sentence

Describe the trigger conditions and processing logic of your business flow, and the AI will automatically create triggers and node chains.

```
Help me orchestrate a workflow that automatically deducts product inventory after an order is created
```

![Order inventory deduction workflow](https://static-docs.nocobase.com/20260419234303.png)

To learn more about workflows, see [Workflow Management](./workflow).

### Data Tables, Pages, and Dashboards — All at Once

:::warning Note

The Solutions feature is currently in testing with limited stability, available for early access only.

:::

Describe your business scenario in one sentence, and the AI will build data tables, management pages, dashboards, and charts all at once.

```
Help me use nocobase-dsl-reconciler skill to build a ticket management system with a dashboard, ticket list, user management, and SLA configuration
```

The AI first outputs a design plan, then builds everything at once after confirmation:

![Ticket system design plan](https://static-docs.nocobase.com/20260420100420.png)

![Ticket system build result](https://static-docs.nocobase.com/20260420100450.png)

To learn more about building complete systems, see [Solutions](./dsl-reconciler).

## Security & Audit

Before letting an AI Agent operate NocoBase, we recommend understanding the authentication methods, permission controls, and operation auditing — ensuring the AI only does what it should, with every step recorded. See [Security & Audit](./security).

## NocoBase Skills

[NocoBase Skills](https://github.com/nocobase/skills) are domain knowledge packages that can be installed into AI Agents, enabling AI to understand NocoBase's configuration system. NocoBase provides 8 Skills covering the entire building workflow:

- [Environment Management](./env-bootstrap) — Environment checks, installation, deployment, upgrades, and troubleshooting
- [Data Modeling](./data-modeling) — Create and manage data tables, fields, and relationships
- [UI Configuration](./ui-builder) — Create and edit pages, blocks, popups, and interactive linkage
- [Workflow Management](./workflow) — Create, edit, enable, and diagnose workflows
- [ACL Configuration](./acl) — Manage roles, permission policies, user bindings, and risk assessments
- [Solutions](./dsl-reconciler) — Batch-build entire business systems from YAML
- [Plugin Management](./plugin-manage) — View, enable, and disable plugins
- [Release Management](./publish) — Cross-environment releases, backup & restore, and migration

:::tip

NocoBase CLI automatically installs Skills during initialization (`nb init`), so manual installation is not required.

:::

## Related Links

- [NocoBase CLI](../ai/quick-start.md) — Command-line tool for installing and managing NocoBase
- [NocoBase CLI Reference](../api/cli/) — Complete parameter reference for all commands
- [AI Plugin Development](../ai-dev/index.md) — Develop NocoBase plugins with AI assistance
- [Security & Audit](./security) — Authentication methods, permission controls, and operation auditing
- [AI Employees](../ai-employees/index.md) — NocoBase's agent capabilities for collaboration and task execution within the business interface
