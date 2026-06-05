---
pkg: '@nocobase/plugin-workflow-parallel'
---

# Parallel Branch

The parallel branch node can divide a workflow into multiple branches. Each branch can be configured with different nodes, and the execution method varies depending on the branch mode. Use the parallel branch node in scenarios where multiple actions need to be executed simultaneously.

## Installation

Built-in plugin, no installation required.

## Create Node

In the workflow configuration interface, click the plus ("+") button in the flow to add a "Parallel Branch" node:


![Add Parallel Branch](https://static-docs.nocobase.com/9e0f3faa0b9335270647a30477559eac.png)


After adding a parallel branch node to the workflow, two sub-branches are added by default. You can also add more branches by clicking the add branch button. Any number of nodes can be added to each branch. Unnecessary branches can be removed by clicking the delete button at the start of the branch.


![Manage Parallel Branches](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)


## Node Configuration

### Branch Mode

The parallel branch node has the following three modes:

- **All succeed**: The workflow will only continue to execute the nodes after the branches finish if all branches execute successfully. Otherwise, if any branch terminates prematurely, whether due to failure, error, or any other non-successful state, the entire parallel branch node will terminate prematurely with that status. This is also known as "All mode".
- **Any succeeds**: The workflow will continue to execute the nodes after the branches finish as soon as any branch executes successfully. The entire parallel branch node will only terminate prematurely if all branches terminate prematurely, whether due to failure, error, or any other non-successful state. This is also known as "Any mode".
- **Any succeeds or fails**: The workflow will continue to execute the nodes after the branches finish as soon as any branch executes successfully. However, if any node fails, the entire parallel branch will terminate prematurely with that status. This is also known as "Race mode".

Regardless of the mode, each branch will be executed in order from left to right until the conditions of the preset branch mode are met, at which point it will either continue to the subsequent nodes or exit prematurely.

## Example

Refer to the example in [Delay Node](./delay.md).