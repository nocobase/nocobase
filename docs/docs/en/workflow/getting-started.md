# Getting Started

## Configure Your First Workflow

Go to the workflow plugin management page from the plugin configuration menu in the top menu bar:


![Workflow plugin management entry](https://static-docs.nocobase.com/20251027222721.png)


The management interface lists all created workflows:


![Workflow Management](https://static-docs.nocobase.com/20251027222900.png)


Click the "Add New" button to create a new workflow and select Collection Event:


![Create Workflow](https://static-docs.nocobase.com/20251027222951.png)


After submitting, click the "Configure" link in the list to enter the workflow configuration interface:


![An empty workflow](https://static-docs.nocobase.com/20251027223131.png)


Then, click the trigger card to open the trigger configuration drawer. Select a previously created collection (e.g., "Posts"), choose "After record added" for the trigger timing, and click the "Save" button to complete the trigger configuration:


![Configure Trigger](https://static-docs.nocobase.com/20251027224735.png)


Next, we can click the plus button in the flow to add a node. For example, select a calculation node to concatenate the "Title" field and the "ID" field from the trigger data:


![Add Calculation Node](https://static-docs.nocobase.com/20251027224842.png)


Click the node card to open the node configuration drawer. Use the `CONCATENATE` function provided by Formula.js to concatenate the "Title" and "ID" fields. The two fields are inserted through the variable selector:


![Calculation node using functions and variables](https://static-docs.nocobase.com/20251027224939.png)


Then, create an update record node to save the result to the "Title" field:


![Create Update Record Node](https://static-docs.nocobase.com/20251027232654.png)


Similarly, click the card to open the update record node's configuration drawer. Select the "Posts" collection, choose the data ID from the trigger for the record ID to update, select "Title" for the field to update, and choose the result from the calculation node for the value:


![Configure Update Record Node](https://static-docs.nocobase.com/20251027232802.png)


Finally, click the "Enable"/"Disable" switch in the upper-right toolbar to switch the workflow to the enabled state, so that the workflow can be triggered and executed.

## Triggering the Workflow

Return to the main system interface, create a post through the posts block, and fill in the post title:


![Create post data](https://static-docs.nocobase.com/20251027233004.png)


After submitting and refreshing the block, you can see that the post title has been automatically updated to the format "Post Title + Post ID":


![Post title modified by workflow](https://static-docs.nocobase.com/20251027233043.png)


:::info{title=Tip}
Since workflows triggered by collection events are executed asynchronously, you cannot see the data update immediately in the interface after submitting the data. However, after a short while, you can see the updated content by refreshing the page or block.
:::

## Viewing Execution History

The workflow has just been successfully triggered and executed once. We can go back to the workflow management interface to view the corresponding execution history:


![View workflow list](https://static-docs.nocobase.com/20251027233246.png)


In the workflow list, you can see that this workflow has generated one execution history. Click the link in the count column to open the execution history records for the corresponding workflow:


![Execution history list for the corresponding workflow](https://static-docs.nocobase.com/20251027233341.png)


Click the "View" link to enter the details page for that execution, where you can see the execution status and result data for each node:


![Workflow execution history details](https://static-docs.nocobase.com/20251027233615.png)


The context data of the trigger and the result data of the node execution can be viewed by clicking the status button in the upper right corner of the corresponding card. For example, let's view the result data of the calculation node:


![Calculation node result](https://static-docs.nocobase.com/20251027233635.png)


You can see that the result data of the calculation node contains the calculated title, which is the data used by the subsequent update record node.

## Summary

Through the steps above, we have completed the configuration and triggering of a simple workflow and have been introduced to the following basic concepts:

- **Workflow**: Used to define the basic information of a flow, including name, trigger type, and enabled status. You can configure any number of nodes within it. It is the entity that carries the flow.
- **Trigger**: Each workflow contains one trigger, which can be configured with specific conditions for the workflow to be triggered. It is the entry point of the flow.
- **Node**: A node is an instruction unit within a workflow that performs a specific action. Multiple nodes in a workflow form a complete execution flow through upstream and downstream relationships.
- **Execution**: An execution is the specific execution object after a workflow is triggered, also known as an execution record or execution history. It contains information such as the execution status and trigger context data. There are also corresponding execution results for each node, which include the node's execution status and result data information.

For more in-depth usage, you can refer to the following content:

- [Triggers](./triggers/index)
- [Nodes](./nodes/index)
- [Using Variables](./advanced/variables)
- [Executions](./advanced/executions)
- [Version Management](./advanced/revisions)
- [Advanced Options](./advanced/options)