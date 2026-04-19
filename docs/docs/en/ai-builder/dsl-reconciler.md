---
title: "Solutions"
description: "The Solutions Skill batch-builds NocoBase applications from YAML configuration files."
keywords: "AI Builder,solutions,application building,YAML,batch table creation,dashboard"
---

# Solutions

## Introduction

The Solutions Skill batch-builds NocoBase applications from YAML configuration files — creating data tables, configuring pages, and generating dashboards and charts all at once.

Ideal for scenarios that require quickly building complete business systems, such as CRM, ticket management, inventory management, and more.

## Installation

```bash
npx skills add nocobase/skills --skill nocobase-dsl-reconciler -y
```

## Capabilities

Can do:

- Design complete application solutions based on requirement descriptions, including data tables, pages, and dashboards
- Batch-create data tables and pages via `structure.yaml`
- Configure popups and forms via `enhance.yaml`
- Automatically generate dashboards with KPI cards and charts
- Incremental updates — always uses `--force` mode without destroying existing data

Cannot do:

- Not suitable for field-level fine-tuning (the [Data Modeling Skill](./data-modeling) is more appropriate)
- Cannot perform data migration or data import
- Cannot configure permissions or workflows (requires other Skills)

## Prompt Examples

### Scenario A: Building a complete system

```
Help me build a ticket management system with a dashboard, ticket list, user management, and SLA configuration
```

The Skill will first output a design plan — listing all data tables and page structures — then execute the build in rounds after confirmation.

### Scenario B: Modifying an existing module

```
Add a "Priority" dropdown field to the ticket table with options P0 through P3
```

Modify `structure.yaml` and update with `--force`.

### Scenario C: Customizing charts

```
Change "New Tickets This Week" to "New Tickets This Month" on the dashboard
```

Edit the corresponding SQL file, changing the time range from `'7 days'` to `'1 month'`, then run `--verify-sql` to validate.

## FAQ

**What should I do if SQL verification fails?**

NocoBase uses PostgreSQL. Column names must use camelCase and be quoted with double quotes (e.g., `"createdAt"`). Date functions should use `NOW() - '7 days'::interval` instead of SQLite syntax. Running `--verify-sql` can catch these issues before deployment.

**What if I want to fine-tune a specific field after building?**

Use the Solutions Skill for the initial full build, then use the [Data Modeling Skill](./data-modeling) or [UI Configuration Skill](./ui-builder) for subsequent fine-tuning — they're more flexible for individual adjustments.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [Data Modeling](./data-modeling) — Use the Data Modeling Skill for field-level fine-tuning
- [UI Configuration](./ui-builder) — Fine-tune pages and block layouts after building
