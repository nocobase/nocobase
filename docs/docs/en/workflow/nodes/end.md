# End Workflow

When this node is executed, it immediately terminates the current workflow with the status configured in the node. It is typically used for flow control based on specific logic, exiting the current workflow when certain conditions are met and stopping the execution of subsequent processes. It is analogous to the `return` instruction in programming languages, used to exit the current function.

## Add Node

In the workflow configuration interface, click the plus ("+") button in the flow to add an "End Workflow" node:


![End Workflow_Add](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)


## Node Configuration


![End Workflow_Node Configuration](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)


### End Status

The end status will affect the final status of the workflow execution. It can be configured as "Succeeded" or "Failed". When the workflow execution reaches this node, it will exit immediately with the configured status.

:::info{title=Note}
When used in a "Before action event" type workflow, it will intercept the request that initiated the action. For details, please refer to [Usage of "Before action event"](../triggers/pre-action).

Also, in addition to intercepting the request that initiated the action, the end status configuration will also affect the status of the feedback in the "response message" for this type of workflow.
:::