---
pkg: '@nocobase/plugin-workflow-subflow'
---

# Invoke Workflow

## Introduction

Used to invoke other workflows from within a workflow. You can use variables from the current workflow as input for the sub-workflow, and use the sub-workflow's output as variables in the current workflow for use in subsequent nodes.

The process of invoking a workflow is shown in the figure below:


![20241230134634](https://static-docs.nocobase.com/20241230134634.png)


By invoking workflows, you can reuse common process logic, such as sending emails, SMS, etc., or break down a complex workflow into multiple sub-workflows for easier management and maintenance.

Essentially, a workflow does not distinguish whether a process is a sub-workflow. Any workflow can be invoked as a sub-workflow by other workflows, and it can also invoke other workflows. All workflows are equal; there is only the relationship of invoking and being invoked.

Similarly, the use of invoking a workflow occurs in two places:

1.  In the main workflow: As the invoker, it invokes other workflows through the "Invoke Workflow" node.
2.  In the sub-workflow: As the invoked party, it saves the variables that need to be output from the current workflow through the "Workflow Output" node, which can be used by subsequent nodes in the workflow that invoked it.

## Create Node

In the workflow configuration interface, click the plus ("+") button in the workflow to add an "Invoke Workflow" node:


![Add Invoke Workflow Node](https://static-docs.nocobase.com/20241230001323.png)


## Configure Node

### Select Workflow

Select the workflow to invoke. You can use the search box for a quick search:


![Select Workflow](https://static-docs.nocobase.com/20241230001534.png)


:::info{title=Tip}
* Disabled workflows can also be invoked as sub-workflows.
* When the current workflow is in synchronous mode, it can only invoke sub-workflows that are also in synchronous mode.
:::

### Configure Workflow Trigger Variables

After selecting a workflow, you also need to configure the trigger's variables as input data to trigger the sub-workflow. You can directly select static data or choose variables from the current workflow:


![Configure Trigger Variables](https://static-docs.nocobase.com/20241230162722.png)


Different types of triggers require different variables, which can be configured on the form as needed.

## Workflow Output Node

Refer to the content of the [Workflow Output](./output.md) node to configure the output variables of the sub-workflow.

## Using Workflow Output

Back in the main workflow, in other nodes below the Invoke Workflow node, when you want to use the output value of the sub-workflow, you can select the result of the Invoke Workflow node. If the sub-workflow outputs a simple value, such as a string, number, boolean, date (date is a string in UTC format), etc., it can be used directly. If it is a complex object (such as an object from a collection), it needs to be mapped through a JSON Parse node before its properties can be used; otherwise, it can only be used as a whole object.

If the sub-workflow does not have a Workflow Output node configured, or if it has no output value, then when using the result of the Invoke Workflow node in the main workflow, you will only get a null value (`null`).