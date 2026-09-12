---
title: "ACL Configuration"
description: "The ACL Configuration Skill manages NocoBase roles, permission policies, user bindings, and ACL risk assessments through natural language."
keywords: "AI Builder,ACL configuration,ACL,roles,permissions,user bindings,risk assessment"
---

# ACL Configuration

:::tip Prerequisites

Before reading this page, make sure you have installed the NocoBase CLI and completed initialization as described in [AI Builder Quick Start](./index.md).

:::

## Introduction

The ACL Configuration Skill manages NocoBase roles, permission policies, user bindings, and ACL risk assessments through natural language — you describe the business objective, and it selects the commands and parameters.


## Capabilities

- Create new roles
- Switch global role modes (independent mode / union mode)
- Batch configure action permissions and data scopes for data tables
- Unbind users from roles
- Generate risk assessment reports at the role, user, and system levels

## Prompt Examples

### Scenario A: Batch binding users
:::tip Prerequisites
The current environment must have a Member role and multiple users
:::

```
Help me bind the Member role to these new users: James, Emma, Michael
```

![Batch binding users](https://static-docs.nocobase.com/20260422202343.png)

### Scenario B: Batch configuring page permissions
:::tip Prerequisites
The current environment must have a Member role and multiple pages
:::
```
Help me configure permissions for the Member role on these pages: Product, Order, Stock
```

![Batch configuring page permissions](https://static-docs.nocobase.com/20260422202949.png)

### Scenario C: Batch configuring multi-table permissions
:::tip Prerequisites
The current environment must have a Member role and multiple data tables
:::

```
Add independent read-only permissions on these data tables for the Member role: order, product, stock
```

![Batch configuring independent table permissions](https://static-docs.nocobase.com/20260422205341.png)

![Batch configuring independent table permissions 2](https://static-docs.nocobase.com/20260422205430.png)

### Scenario D: Multi-role multi-table permission configuration
:::tip Prerequisites
The current environment must have multiple roles and multiple data tables
:::

```
Add independent read-write permissions on these data tables for the Member and Sales roles: order, product, stock
```

![Multi-role multi-table configuration](https://static-docs.nocobase.com/20260422213524.png)

### Scenario E: Risk assessment

```
Assess the permission risks of the Member role
```

This will output a risk score, impact scope description, and improvement recommendations.

## FAQ

**What should I do if permissions are configured but not taking effect?**

First check whether the global role mode is correct — if a user has multiple roles simultaneously, the behavior difference between union mode and independent mode is significant. You can check the current mode to confirm the issue.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [NocoBase CLI](../ai/quick-start.md) — Command-line tool for installing and managing NocoBase
