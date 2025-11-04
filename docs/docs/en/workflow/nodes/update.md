# Update Data

Used to update data in a collection that meets specified conditions.

The collection and field assignment parts are the same as the "Create record" node. The main difference with the "Update data" node is the addition of filter conditions and the need to select an update mode. Additionally, the result of the "Update data" node returns the number of rows successfully updated. This can only be viewed in the execution history and cannot be used as a variable in subsequent nodes.

## Create Node

In the workflow configuration interface, click the plus ("+") button in the flow to add an "Update data" node:


![Add Update Data Node](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)


## Node Configuration


![Update Data Node Configuration](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)


### Collection

Select the collection where data needs to be updated.

### Update Mode

There are two update modes:

*   **Bulk update**: Does not trigger collection events for each updated record. It offers better performance and is suitable for large-volume update operations.
*   **Update one by one**: Triggers collection events for each updated record. However, it may cause performance issues with large volumes of data and should be used with caution.

The choice usually depends on the target data for the update and whether other workflow events need to be triggered. If updating a single record based on the primary key, "Update one by one" is recommended. If updating multiple records based on conditions, "Bulk update" is recommended.

### Filter Conditions

Similar to the filter conditions in a normal collection query, you can use context variables from the workflow.

### Field Values

Similar to field assignment in the "Create record" node, you can use context variables from the workflow or manually enter static values.

Note: Data updated by the "Update data" node in a workflow does not automatically handle the "Last modified by" data. You need to configure the value of this field yourself as needed.

## Example

For example, when a new "Article" is created, you need to automatically update the "Article Count" field in the "Article Category" collection. This can be achieved using the "Update data" node:


![Update Data Node Example Configuration](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)


After the workflow is triggered, it will automatically update the "Article Count" field of the "Article Category" collection to the current article count + 1.