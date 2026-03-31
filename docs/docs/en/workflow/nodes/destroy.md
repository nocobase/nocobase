# Delete data

Used to delete data from a collection that meets certain conditions.

The basic usage of the delete node is similar to the update node, except that the delete node does not require field assignment. You only need to select the collection and filter conditions. The result of the delete node returns the number of rows successfully deleted, which can only be viewed in the execution history and cannot be used as a variable in subsequent nodes.

:::info{title=Note}
Currently, the delete node does not support row-by-row deletion; it performs batch deletions. Therefore, it will not trigger other events for each individual data deletion.
:::

## Create node

In the workflow configuration interface, click the plus ("+") button in the flow to add a "Delete data" node:


![Create delete data node](https://static-docs.nocobase.com/e1d6b8728251fcdbed6c7f50e5570da2.png)


## Node configuration


![Delete node_Node configuration](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)


### Collection

Select the collection from which to delete data.

### Filter conditions

Similar to the filter conditions for a regular collection query, you can use the workflow's context variables.

## Example

For example, to periodically clean up canceled and invalid historical order data, you can use the delete node:


![Delete node_Example_Node configuration](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)


The workflow will be triggered periodically and execute the deletion of all canceled and invalid historical order data.