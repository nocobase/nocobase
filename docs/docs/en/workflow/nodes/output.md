---
pkg: '@nocobase/plugin-workflow-subflow'
---

# Workflow Output

## Introduction

The "Workflow Output" node is used in a called workflow to define its output value. When one workflow is called by another, the "Workflow Output" node can be used to pass a value back to the caller.

## Create Node

In the called workflow, add a "Workflow Output" node:


![20241231002033](https://static-docs.nocobase.com/20241231002033.png)


## Configure Node

### Output Value

Enter or select a variable as the output value. The output value can be of any type, such as a constant (string, number, boolean, date, or custom JSON), or another variable from the workflow.


![20241231003059](https://static-docs.nocobase.com/20241231003059.png)


:::info{title=Tip}
If multiple "Workflow Output" nodes are added to a called workflow, the value of the last executed "Workflow Output" node will be output when the workflow is called.
:::