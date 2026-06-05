# Overview

A workflow is typically composed of several connected operational steps. Each node represents one of these steps and serves as a basic logical unit in the process. Just like in a programming language, different types of nodes represent different instructions, which determine the node's behavior. When the workflow runs, the system enters each node sequentially and executes its instructions.

:::info{title=Note}
A workflow's trigger is not a node. It is only displayed as an entry point in the flowchart, but it is a different concept from a node. For details, please refer to the [Triggers](../triggers/index.md) content.
:::

From a functional perspective, the currently implemented nodes can be divided into several major categories (28 types of nodes in total):

- Artificial Intelligence
  - [Large Language Model](../../ai-employees/workflow/nodes/llm/chat.md) (provided by @nocobase/plugin-workflow-llm plugin)
- Control Flow
  - [Condition](./condition.md)
  - [Multi-conditions](./multi-conditions.md)
  - [Loop](./loop.md) (provided by @nocobase/plugin-workflow-loop plugin)
  - [Variable](./variable.md) (provided by @nocobase/plugin-workflow-variable plugin)
  - [Parallel Branch](./parallel.md) (provided by @nocobase/plugin-workflow-parallel plugin)
  - [Invoke Workflow](./subflow.md) (provided by @nocobase/plugin-workflow-subflow plugin)
  - [Workflow Output](./output.md) (provided by @nocobase/plugin-workflow-subflow plugin)
  - [JSON Variable Mapping](./json-variable-mapping.md) (provided by @nocobase/plugin-workflow-json-variable-mapping plugin)
  - [Delay](./delay.md) (provided by @nocobase/plugin-workflow-delay plugin)
  - [End Workflow](./end.md)
- Calculation
  - [Calculation](./calculation.md)
  - [Date Calculation](./date-calculation.md) (provided by @nocobase/plugin-workflow-date-calculation plugin)
  - [JSON Calculation](./json-query.md) (provided by @nocobase/plugin-workflow-json-query plugin)
- Collection Actions
  - [Create Data](./create.md)
  - [Update Data](./update.md)
  - [Delete Data](./destroy.md)
  - [Query Data](./query.md)
  - [Aggregate Query](./aggregate.md) (provided by @nocobase/plugin-workflow-aggregate plugin)
  - [SQL Action](./sql.md) (provided by @nocobase/plugin-workflow-sql plugin)
- Manual Handling
  - [Manual Handling](./manual.md) (provided by @nocobase/plugin-workflow-manual plugin)
  - [Approval](./approval.md) (provided by @nocobase/plugin-workflow-approval plugin)
  - [CC](./cc.md) (provided by @nocobase/plugin-workflow-cc plugin)
- Other Extensions
  - [HTTP Request](./request.md) (provided by @nocobase/plugin-workflow-request plugin)
  - [JavaScript](./javascript.md) (provided by @nocobase/plugin-workflow-javascript plugin)
  - [Send Email](./mailer.md) (provided by @nocobase/plugin-workflow-mailer plugin)
  - [Notification](../../notification-manager/index.md#工作流通知节点) (provided by @nocobase/plugin-workflow-notification plugin)
  - [Response](./response.md) (provided by @nocobase/plugin-workflow-webhook plugin)
  - [Response Message](./response-message.md) (provided by @nocobase/plugin-workflow-response-message plugin)
