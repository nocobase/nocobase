# Bind Workflow

## Introduction

On some action buttons, you can configure a bound workflow to associate the action with a workflow, achieving automated data processing.


![20251029144822](https://static-docs.nocobase.com/20251029144822.png)



![20251029145017](https://static-docs.nocobase.com/20251029145017.png)


## Supported Actions and Workflow Types

The currently supported action buttons and workflow types are as follows:

| Action Button \ Workflow Type | Before action event | After action event | Approval event | Custom action event |
| --- | --- | --- | --- | --- |
| Form's "Submit", "Save" buttons | ✅ | ✅ | ✅ | ❌ |
| "Update record" button in data rows (Table, List, etc.) | ✅ | ✅ | ✅ | ❌ |
| "Delete" button in data rows (Table, List, etc.) | ✅ | ❌ | ❌ | ❌ |
| "Trigger workflow" button | ❌ | ❌ | ❌ | ✅ |

## Binding Multiple Workflows

An action button can be bound to multiple workflows. When multiple workflows are bound, their execution order follows these rules:

1. For workflows of the same trigger type, synchronous workflows execute first, followed by asynchronous workflows.
2. Workflows of the same trigger type execute in the configured order.
3. Between workflows of different trigger types:
    1. Before action events are always executed before after action and approval events.
    2. After action and approval events have no specific order, and business logic should not depend on the configuration order.

## More

For different workflow event types, refer to the detailed documentation of the relevant plugins:

* [After action event]
* [Before action event]
* [Approval event]
* [Custom action event]