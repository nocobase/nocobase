---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---

# Custom Action Event

## Introduction

NocoBase has built-in common data actions (add, delete, update, view, etc.). When these actions cannot meet complex business needs, you can use custom action events in a workflow. By binding this event to a "Trigger Workflow" button in a page block, a custom action workflow will be triggered when a user clicks it.

## Create a Workflow

When creating a workflow, select "Custom Action Event":


![Create "Custom Action Event" workflow](https://static-docs.nocobase.com/20240509091820.png)


## Trigger Configuration

### Context Type

> v1.6.0+

The context type determines which block buttons the workflow can be bound to:

*   No Context: A global event that can be bound to action buttons in the Action Bar and data blocks.
*   Single Record: Can be bound to action buttons in data blocks such as table rows, forms, and details.
*   Multiple Records: Can be bound to bulk action buttons in a table.


![Trigger Configuration_Context Type](https://static-docs.nocobase.com/20250215135808.png)


### Collection

When the context type is Single Record or Multiple Records, you need to select the collection to bind the data model to:


![Trigger Configuration_Select Collection](https://static-docs.nocobase.com/20250215135919.png)


### Association Data to be Used

If you need to use the association data of the triggering data row in the workflow, you can select deep association fields here:


![Trigger Configuration_Select Association Data to be Used](https://static-docs.nocobase.com/20250215135955.png)


These fields will be automatically preloaded into the workflow context after the event is triggered, making them available for use in the workflow.

## Action Configuration

The configuration of action buttons in different blocks varies depending on the context type configured in the workflow.

### No Context

> v1.6.0+

In the Action Bar and other data blocks, you can add a "Trigger Workflow" button:


![Add Action Button to Block_Action Bar](https://static-docs.nocobase.com/20250215221738.png)



![Add Action Button to Block_Calendar](https://static-docs.nocobase.com/20250215221942.png)



![Add Action Button to Block_Gantt Chart](https://static-docs.nocobase.com/20250215221810.png)


After adding the button, bind the previously created no-context workflow. Here is an example using a button in the Action Bar:


![Bind Workflow to Button_Action Bar](https://static-docs.nocobase.com/20250215222120.png)



![Select Workflow to Bind_No Context](https://static-docs.nocobase.com/20250215222234.png)


### Single Record

In any data block, a "Trigger Workflow" button can be added to the action bar for a single record, such as in forms, table rows, details, etc.:


![Add Action Button to Block_Form](https://static-docs.nocobase.com/20240509165428.png)



![Add Action Button to Block_Table Row](https://static-docs.nocobase.com/20240509165340.png)



![Add Action Button to Block_Details](https://static-docs.nocobase.com/20240509165545.png)


After adding the button, bind the previously created workflow:


![Bind Workflow to Button](https://static-docs.nocobase.com/20240509165631.png)



![Select Workflow to Bind](https://static-docs.nocobase.com/20240509165658.png)


Afterward, clicking this button will trigger the custom action event:


![Result of Clicking the Button](https://static-docs.nocobase.com/20240509170453.png)


### Multiple Records

> v1.6.0+

In the action bar of a table block, when adding a "Trigger Workflow" button, there is an additional option to select the context type: "No Context" or "Multiple Records":


![Add Action Button to Block_Table](https://static-docs.nocobase.com/20250215222507.png)


When "No Context" is selected, it is a global event and can only be bound to no-context workflows.

When "Multiple Records" is selected, you can bind a multiple-records workflow, which can be used for bulk actions after selecting multiple records (currently only supported by tables). The available workflows are limited to those configured to match the collection of the current data block:


![20250215224436](https://static-docs.nocobase.com/20250215224436.png)


When clicking the button to trigger, some data rows in the table must be checked; otherwise, the workflow will not be triggered:


![20250215224736](https://static-docs.nocobase.com/20250215224736.png)


## Example

For example, we have a "Samples" collection. For samples with a status of "Collected", we need to provide a "Submit for Inspection" action. This action will first check the basic information of the sample, then generate a "Inspection Record", and finally change the sample's status to "Submitted". This series of processes cannot be completed with simple "add, delete, update, view" button clicks, so a custom action event can be used to implement it.

First, create a "Samples" collection and an "Inspection Records" collection, and enter some basic test data into the Samples collection:


![Example_Samples Collection](https://static-docs.nocobase.com/20240509172234.png)


Then, create a "Custom Action Event" workflow. If you need timely feedback from the operation process, you can choose synchronous mode (in synchronous mode, you cannot use asynchronous nodes like manual processing):


![Example_Create Workflow](https://static-docs.nocobase.com/20240509173106.png)


In the trigger configuration, select "Samples" for the collection:


![Example_Trigger Configuration](https://static-docs.nocobase.com/20240509173148.png)


Arrange the logic in the process according to business requirements. For example, allow submission for inspection only when the indicator parameter is greater than `90`; otherwise, display a relevant message:


![Example_Business Logic Arrangement](https://static-docs.nocobase.com/20240509174159.png)


:::info{title=Tip}
The "[Response Message](../nodes/response-message.md)" node can be used in synchronous custom action events to return a prompt message to the client. It cannot be used in asynchronous mode.
:::

After configuring and enabling the workflow, return to the table interface and add a "Trigger Workflow" button in the action column of the table:


![Example_Add Action Button](https://static-docs.nocobase.com/20240509174525.png)


Then, in the button's configuration menu, choose to bind a workflow and open the configuration pop-up:


![Example_Open Bind Workflow Pop-up](https://static-docs.nocobase.com/20240509174633.png)


Add the previously enabled workflow:


![Example_Select Workflow](https://static-docs.nocobase.com/20240509174723.png)


After submitting, change the button text to the action name, such as "Submit for Inspection". The configuration process is now complete.

To use it, select any sample data in the table and click the "Submit for Inspection" button to trigger the custom action event. As per the logic arranged earlier, if the sample's indicator parameter is less than 90, the following prompt will be displayed after clicking:


![Example_Indicator Does Not Meet Submission Criteria](https://static-docs.nocobase.com/20240509175026.png)


If the indicator parameter is greater than 90, the process will execute normally, generating an "Inspection Record" and changing the sample's status to "Submitted":


![Example_Submission Successful](https://static-docs.nocobase.com/20240509175247.png)


At this point, a simple custom action event is complete. Similarly, for businesses with complex operations like order processing or report submission, custom action events can be used for implementation.

## External Call

The triggering of custom action events is not limited to user interface actions; it can also be triggered via HTTP API calls. Specifically, custom action events provide a new action type for all collection actions to trigger workflows: `trigger`, which can be called using NocoBase's standard action API.

:::info{title="Tip"}
Since external calls also need to be based on user identity, when calling via HTTP API, just like requests sent from the regular interface, you need to provide authentication information. This includes the `Authorization` request header or `token` parameter (the token obtained upon login), and the `X-Role` request header (the user's current role name).
:::

### No Context

No-context workflows need to be triggered on the workflows resource:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Single Record

A workflow triggered by a button, as in the example, can be called like this:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Since this action is for a single record, when calling it on existing data, you need to specify the ID of the data row, replacing the `<:id>` part in the URL.

If it's called for a form (such as for creating or updating), you can omit the ID for a form that creates new data, but you must pass the submitted data as the execution context:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

For an update form, you need to pass both the ID of the data row and the updated data:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

If both an ID and data are passed, the data row corresponding to the ID will be loaded first, and then the properties from the passed data object will be used to overwrite the original data row to get the final trigger data context.

:::warning{title="Note"}
If association data is passed, it will also be overwritten. Be especially cautious when handling incoming data if preloading of association data items is configured, to avoid unexpected overwrites of association data.
:::

Additionally, the URL parameter `triggerWorkflows` is the workflow's key; multiple workflow keys are separated by commas. This key can be obtained by hovering the mouse over the workflow name at the top of the workflow canvas:


![Workflow_Key_View Method](https://static-docs.nocobase.com/20240426135108.png)


After a successful call, the custom action event for the corresponding `samples` collection will be triggered.

:::info{title="Tip"}
When triggering an action event via an HTTP API call, you also need to pay attention to the workflow's enabled status and whether the collection configuration matches; otherwise, the call may not succeed or may result in an error.
:::
