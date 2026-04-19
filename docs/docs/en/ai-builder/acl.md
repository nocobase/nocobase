---
title: "ACL Configuration"
description: "The ACL Configuration Skill manages NocoBase roles, permission policies, user bindings, and ACL risk assessments through natural language."
keywords: "AI Builder,ACL configuration,ACL,roles,permissions,user bindings,risk assessment"
---

# ACL Configuration

## Introduction

The ACL Configuration Skill manages NocoBase roles, permission policies, user bindings, and ACL risk assessments through natural language — you describe the business objective, and it selects the commands and parameters.

Before use, make sure the [NocoBase CLI](../get-started/nocobase-cli.md) environment is ready.

## Installation

```bash
npx skills add nocobase/skills --skill nocobase-acl-manage -y
```

## Capabilities

- Create roles and set initial permission baselines
- Switch global role modes (independent mode / union mode)
- Configure action permissions and data scopes for data tables
- Batch bind or unbind users and roles
- Generate risk assessment reports at the role, user, and system levels

## Prompt Examples

### Scenario A: Creating a role

```
Create a sales role for me
```

After creation, it will automatically include the default read-only baseline permissions, then guide you through further permission configuration.

![Creating a role](https://static-docs.nocobase.com/20260417152303.png)

### Scenario B: Configuring system permissions

```
Configure plugin management permissions for the sales role
```

![Configuring system permissions](https://static-docs.nocobase.com/20260417152433.png)

### Scenario C: Configuring data source permissions

```
Configure view and edit permissions on the customer management table for the sales role
```

![Configuring data source permissions](https://static-docs.nocobase.com/20260417152620.png)

### Scenario D: Configuring page permissions

```
Configure permissions for the product management page for the sales role
```

![Configuring page permissions](https://static-docs.nocobase.com/20260417152705.png)

### Scenario E: Binding a user to a role

```
Bind user Zhang San to the sales role
```

![Binding a user to a role](https://static-docs.nocobase.com/20260417152813.png)

### Scenario F: Risk assessment

```
Assess the permission risks of the admin role
```

This will output a risk score, impact scope description, and improvement recommendations.

## FAQ

**What should I do if permissions are configured but not taking effect?**

First check whether the global role mode is correct — if a user has multiple roles simultaneously, the behavior difference between union mode and independent mode is significant. You can check the current mode to confirm the issue.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [NocoBase CLI](../get-started/nocobase-cli.md) — Command-line tool for installing and managing NocoBase
