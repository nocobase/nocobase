---
title: "UI Configuration"
description: "The UI Configuration Skill creates and edits NocoBase pages, blocks, fields, and action configurations."
keywords: "AI Builder,UI configuration,pages,blocks,popups,linkage,UI Builder"
---

# UI Configuration

## Introduction

The UI Configuration Skill creates and edits NocoBase pages, blocks, fields, and action configurations — you describe the page you want in business language, and it handles blueprint generation, block layout, and interactive linkage.

## Installation

```bash
npx skills add nocobase/skills --skill nocobase-ui-builder -y
```

## Capabilities

Can do:

- Create complete pages: Tables, filter forms, and detail popups in one step
- Edit existing pages: Add blocks, adjust fields, configure popups
- Set up interactive linkage: Default values, field visibility, calculated linkage, action button states
- Use template reuse: Save repetitive popups and blocks as templates
- Support multi-page tasks: Build pages sequentially in order

Cannot do:

- Cannot configure ACL permissions (use the [ACL Configuration Skill](./acl))
- Cannot design data table structures (use the [Data Modeling Skill](./data-modeling))
- Cannot orchestrate workflows (use the [Workflow Management Skill](./workflow))
- Cannot handle non-modern page (v2) navigation

## Prompt Examples

### Scenario A: Creating a management page

```
Help me create a customer management page with a name search box and a customer table showing name, phone, email, and creation time
```

The Skill will first read the collection fields, generate a page blueprint with an ASCII preview, and write it after confirmation.

### Scenario B: Configuring popups

```
When clicking a customer name in the table, pop up a detail page showing all fields
```

It will prefer a field popup (click to pop up) rather than adding an extra action button.

### Scenario C: Setting up linkage rules

```
When the status field is set to "Completed", automatically hide the "Assignee" field
```

This is implemented through interactive linkage rules without manually writing configuration.

## FAQ

**What should I do if the block shows no data after page creation?**

First confirm that the corresponding data table actually has records. Also check whether the block's bound collection and data source are correct.

**What if I want multiple blocks in a popup?**

You can describe the popup content in the prompt, such as "Put a form and a related table in the edit popup." The Skill will generate a custom popup layout containing multiple blocks.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [Data Modeling](./data-modeling) — Create and manage data tables, fields, and relationships with AI
- [ACL Configuration](./acl) — Configure roles and data access permissions
- [Workflow Management](./workflow) — Create, edit, and diagnose workflows
