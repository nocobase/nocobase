---
title: "UI Configuration"
description: "The UI Configuration Skill creates and edits NocoBase pages, blocks, fields, and action configurations."
keywords: "AI Builder,UI configuration,pages,blocks,popups,linkage,UI Builder"
---

# UI Configuration

:::tip Prerequisites

Before reading this page, make sure you have installed the NocoBase CLI and completed initialization as described in [AI Builder Quick Start](./index.md).

:::

## Introduction

The UI Configuration Skill creates and edits NocoBase pages, blocks, fields, and action configurations — you describe the page you want in business language, and it handles blueprint generation, block layout, and interactive linkage.


## Capabilities

Can do:

- Create complete pages: Tables, filter forms, and detail popups in one step
- Edit existing pages: Add blocks, adjust fields, configure popups, adjust layouts
- Set up interactive linkage: Default values, field visibility, calculated linkage, action button states
- Use template reuse: Save repetitive popups and blocks as templates
- Support multi-page tasks: Build pages sequentially in order

Cannot do:

- Cannot configure ACL permissions (use the [ACL Configuration Skill](./acl))
- Cannot design data table structures (use the [Data Modeling Skill](./data-modeling))
- Cannot orchestrate workflows (use the [Workflow Management Skill](./workflow))
- Cannot handle non-modern page (v1) navigation, only supports v2 pages.

## Prompt Examples

### Scenario A: Creating a management page

```
Help me create a customer management page with a name search box and a customer table showing name, phone, email, and creation time
```

The Skill will first read the collection fields, then generate and write the page blueprint.

![Creating a management page](https://static-docs.nocobase.com/20260420100608.png)


### Scenario B: Configuring popups

```
When clicking a customer name in the table, pop up a detail page showing all fields
```

It will prefer a field popup (click to pop up) rather than adding an extra action button.

![Configuring popups](https://static-docs.nocobase.com/20260420100641.png)

### Scenario C: Setting up linkage rules

```
Add a field rule to the edit form in popup /admin/c0vc2vmkfll/view/cec3e7a69ac/filterbytk/1:
When user id is 1, disable editing of username
```

This is implemented through linkage rules without manually writing configuration.

![Setting up linkage rules](https://static-docs.nocobase.com/20260420100709.png)

### Scenario D: Multi-page building

```
Help me build a user management system with two pages: a user management page and a role management page, grouped under one page group.
```

It will provide a simple multi-page design, which can be adjusted and confirmed before building.

![Multi-page building](https://static-docs.nocobase.com/20260420100731.png)

## FAQ

**What should I do if the block shows no data after page creation?**

First confirm that the corresponding data table actually has records. Also check whether the block's bound collection and data source are correct. You can also use the [Data Modeling Skill](./data-modeling) to create mock data directly.

**What if I want multiple blocks in a popup?**

You can describe the popup content in the prompt, such as "Put a form and a related table in the edit popup." The Skill will generate a custom popup layout containing multiple blocks.

**Will manual configuration and AI configuration interfere with each other?**

If manual configuration and AI configuration are done simultaneously, they may interfere with each other. If they are not done at the same time, there will be no interference.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [Data Modeling](./data-modeling) — Create and manage data tables, fields, and relationships with AI
- [ACL Configuration](./acl) — Configure roles and data access permissions
- [Workflow Management](./workflow) — Create, edit, and diagnose workflows
