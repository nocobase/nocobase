# Collection Events

## Introduction

Triggers of the collection event type will listen for create, update, and delete events on a collection. When a data operation on that collection occurs and meets the configured conditions, it triggers the corresponding workflow. For example, scenarios like deducting product inventory after a new order is created, or waiting for manual review after a new comment is added.

## Basic Usage

There are several types of collection changes:

1. After creating data.
2. After updating data.
3. After creating or updating data.
4. After deleting data.


![Collection Event_Trigger Timing Selection](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)


You can choose the trigger timing based on different business needs. When the selected change includes updating the collection, you can also specify the fields that have changed. The trigger condition is met only when the selected fields change. If no fields are selected, it means a change in any field can trigger the workflow.


![Collection Event_Select Changed Fields](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)


More specifically, you can configure condition rules for each field of the triggering data row. The trigger will only fire when the fields meet the corresponding conditions.


![Collection Event_Configure Data Conditions](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)


After a collection event is triggered, the data row that generated the event will be injected into the execution plan as trigger context data, to be used as variables by subsequent nodes in the workflow. However, when subsequent nodes need to use the relationship fields of this data, you need to configure preloading of the relationship data first. The selected relationship data will be injected into the context along with the trigger and can be selected and used hierarchically.

## Related Tips

### Triggering by Bulk Data Operations is Not Currently Supported

Collection events do not currently support triggering by bulk data operations. For example, when creating an article and simultaneously adding multiple tags for that article (one-to-many relationship data), only the workflow for creating the article will be triggered. The simultaneously created multiple tags will not trigger the workflow for creating tags. When associating or adding many-to-many relationship data, the workflow for the intermediate collection will not be triggered either.

### Data Operations Outside the Application Will Not Trigger Events

Operations on collections via HTTP API calls to the application's interface can also trigger corresponding events. However, if data changes are made directly through database operations instead of through the NocoBase application, the corresponding events cannot be triggered. For example, native database triggers will not be associated with workflows in the application.

Additionally, using the SQL action node to operate on the database is equivalent to direct database operations and will not trigger collection events.

### External Data Sources

Workflows have supported external data sources since version `0.20`. If you are using an external data source plugin and the collection event is configured for an external data source, as long as the data operations on that data source are performed within the application (such as user creation, updates, and workflow data operations), the corresponding collection events can be triggered. However, if the data changes are made through other systems or directly in the external database, collection events cannot be triggered.

## Example

Let's take the scenario of calculating the total price and deducting inventory after a new order is created as an example.

First, we create a Products collection and an Orders collection with the following data models:

| Field Name | Field Type |
| --- | --- |
| Product Name | Single Line Text |
| Price | Number |
| Inventory | Integer |

| Field Name | Field Type |
| --- | --- |
| Order ID | Sequence |
| Order Product | Many-to-One (Products) |
| Order Total | Number |

And add some basic product data:

| Product Name | Price | Inventory |
| --- | --- | --- |
| iPhone 14 Pro | 7999 | 10 |
| iPhone 13 Pro | 5999 | 0 |

Then, create a workflow based on the Orders collection event:


![Collection Event_Example_New Order Trigger](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)


Here are some of the configuration options:

- Collection: Select the "Orders" collection.
- Trigger timing: Select "After creating data".
- Trigger conditions: Leave blank.
- Preload relationship data: Check "Products".

Then, configure other nodes according to the workflow logic: check if the product inventory is greater than 0. If it is, deduct the inventory; otherwise, the order is invalid and should be deleted:


![Collection Event_Example_New Order Workflow Orchestration](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)


The configuration of nodes will be explained in detail in the documentation for specific node types.

Enable this workflow and test it by creating a new order through the interface. After placing an order for "iPhone 14 Pro", the inventory of the corresponding product will be reduced to 9. If an order is placed for "iPhone 13 Pro", the order will be deleted due to insufficient inventory.


![Collection Event_Example_New Order Execution Result](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)