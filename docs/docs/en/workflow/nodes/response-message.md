---
pkg: '@nocobase/plugin-workflow-response-message'
---

# Response Message

## Introduction

The response message node is used to send custom messages from the workflow back to the client that submitted the action in specific types of workflows.

:::info{title=Note}
Currently, it is supported for use in "Before action event" and "Custom action event" type workflows in synchronous mode.
:::

## Creating a Node

In supported workflow types, you can add a "Response message" node anywhere in the workflow. Click the plus ("+") button in the workflow to add a "Response message" node:


![Adding a node](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)


The response message exists as an array throughout the request process. Whenever a response message node is executed in the workflow, the new message content is appended to the array. When the server sends the response, all messages are sent to the client together.

## Node Configuration

The message content is a template string where variables can be inserted. You can organize this template content in the node configuration:


![Node configuration](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)


When the workflow executes to this node, the template will be parsed to generate the message content. In the configuration above, the variable "Local variable / Loop all products / Loop object / Product / Title" will be replaced with a specific value in the actual workflow, for example:

```
Product "iPhone 14 pro" is out of stock
```


![Message content](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)


## Workflow Configuration

The status of the response message depends on the success or failure of the workflow execution. The failure of any node will cause the entire workflow to fail. In this case, the message content will be returned to the client with a failure status and displayed.

If you need to actively define a failure state in the workflow, you can use an "End node" and configure it to a failure state. When this node is executed, the workflow will exit with a failure status, and the message will be returned to the client with a failure status.

If the entire workflow does not produce a failure state and executes successfully to the end, the message content will be returned to the client with a success status.

:::info{title=Note}
If multiple response message nodes are defined in the workflow, the executed nodes will append the message content to an array. When finally returning to the client, all message content will be returned and displayed together.
:::

## Use Cases

### "Before action event" Workflow

Using a response message in a "Before action event" workflow allows sending corresponding message feedback to the client after the workflow ends. For details, refer to [Before action event](../triggers/pre-action.md).

### "Custom action event" Workflow

Using a response message in a "Custom action event" in synchronous mode allows sending corresponding message feedback to the client after the workflow ends. For details, refer to [Custom action event](../triggers/custom-action.md).