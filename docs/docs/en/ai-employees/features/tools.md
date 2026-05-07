---
pkg: '@nocobase/plugin-ai'
title: 'AI Employee Tools'
description: 'Tools define what AI Employees can do: General tools, Employee-specific tools, and Custom tools. Configure tool permissions with Ask/Allow.'
keywords: 'AI Employee tools,Tools,Ask,Allow,tool permissions,NocoBase'
---

# Use Tools

Tools define what an AI Employee can do.

## Tool Structure

The tools page is split into three sections:

1. `General tools`: shared by all AI Employees, usually read-only.
2. `Employee-specific tools`: exclusive to the current employee.
3. `Custom tools`: custom tools created via the "AI employee event" trigger in workflows. Can be added/removed and configured with default permissions.

![20260331182248](https://static-docs.nocobase.com/20260331182248.png)

## Tool Permissions

Tool permissions are unified as:

- `Ask`: ask for confirmation before calling.
- `Allow`: allow direct calling.

Recommendation: use `Ask` by default for data-modifying tools.

![20260331182832](https://static-docs.nocobase.com/20260331182832.png)

## Tool Descriptions

### General Tools

| Tool Name | Description |
| --- | --- |
| Form filler | Fill data into specified forms |
| Chart generator | Generate ECharts chart JSON configuration |
| Load specific SKILLS | Load skills and the tools required by skills |
| Suggestions | Provide next-step action suggestions based on the current conversation content and context |

### Employee-specific Tools

| Tool Name | Description | Employee |
| --- | --- | --- |
| AI employee task dispatching | Task dispatching tool that assigns tasks based on task type and employee capabilities | Atlas |
| List AI employees | List all available employees | Atlas |
| Get AI employee | Get detailed information about a specified employee, including skills and tools | Atlas |

### Custom Tools

Create a workflow in the workflow module with the trigger type set to `AI employee event`.

![20260331185556](https://static-docs.nocobase.com/20260331185556.png)

Click `Add tool` in `Custom tools` to add workflows as tools, and configure permissions based on business risk.

![20260331185711](https://static-docs.nocobase.com/20260331185711.png)
