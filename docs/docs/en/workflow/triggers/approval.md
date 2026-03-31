---
pkg: '@nocobase/plugin-workflow-approval'
---

# Approval

## Introduction

Approval is a process type specifically designed for human-initiated and human-processed tasks to decide the status of relevant data. It is commonly used for office automation or other manual decision-making processes, such as creating and managing manual workflows for scenarios like "leave requests," "expense reimbursement approvals," and "raw material procurement approvals."

The Approval plugin provides a dedicated workflow type (trigger) "Approval (event)" and a dedicated "Approval" node for this process. Combined with NocoBase's unique custom collections and custom blocks, you can quickly and flexibly create and manage various approval scenarios.

## Create a Workflow

When creating a workflow, select the "Approval" type to create an approval workflow:


![Approval Trigger_Create Approval Workflow](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)


Afterward, in the workflow configuration interface, click the trigger to open a dialog for more configuration.

## Trigger Configuration

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Bind a Collection

NocoBase's Approval plugin is designed for flexibility and can be used with any custom collection. This means the approval configuration does not need to reconfigure the data model but directly reuses an existing collection. Therefore, after entering the trigger configuration, you first need to select a collection to determine which collection's data creation or update will trigger this workflow:

![Approval Trigger_Trigger Configuration_Select Collection](https://static-docs.nocobase.com/20251226103223.png)

### Withdraw

If an approval workflow allows the initiator to withdraw it, you need to enable the "Withdraw" button in the initiator's interface configuration:


![Approval Trigger_Trigger Configuration_Allow Withdraw](https://static-docs.nocobase.com/20251029232544.png)


Once enabled, an approval initiated by this workflow can be withdrawn by the initiator before any approver processes it. However, after any approver in a subsequent approval node has processed it, it can no longer be withdrawn.

:::info{title=Note}
After enabling or deleting the withdraw button, you need to click save and submit in the trigger configuration dialog for the changes to take effect.
:::

### Initiator's Form Interface Configuration

Finally, you need to configure the initiator's form interface. This interface will be used for submission actions when initiating from the approval center block and when re-initiating after a withdrawal. Click the configure button to open the dialog:


![Approval Trigger_Trigger Configuration_Initiator Form](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)


You can add a form for the initiator's interface based on the bound collection, or add descriptive text (Markdown) for prompts and guidance. The form is mandatory; otherwise, the initiator will not be able to perform any actions upon entering this interface.

After adding a form block, just like in a regular form configuration interface, you can add field components from the corresponding collection and arrange them as needed to organize the content to be filled in the form:


![Approval Trigger_Trigger Configuration_Initiator Form_Field Configuration](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)


In addition to the direct submit button, you can also add a "Save as Draft" action button to support a temporary storage process:


![Approval Trigger_Trigger Configuration_Initiator Form_Action Configuration](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

### "My application" Card <Badge>2.0+</Badge>

Could be used to configure task card of "My application" in the tasks center.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

Any fields (unless association fields) in the business collection, or approval information could be configured freely to display on the card.

After applied, the customized task card will show in the list of tasks center:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Record show mode in the flow

*   **Snapshot**

    Applicant and approvers will see the record as it was when they entered, and after submitting, only see changed record by themself — not any later updates made by others.

*   **Latest**

    Applicant and approvers will always see the latest version of the record in the flow, no matter what it was before their action. After the flow is done, they will see the final version of the record.


## Approval Node

In an approval workflow, you need to use the dedicated "Approval" node to configure the operational logic for approvers to process (approve, reject, or return) the initiated approval. The "Approval" node can only be used in approval workflows. Refer to [Approval Node](../nodes/approval.md) for details.

:::info{title=Note}
If an approval workflow does not contain any "Approval" nodes, the workflow will be automatically approved.
:::

## Configure Approval Initiation

After configuring and enabling an approval workflow, you can bind it to the submit button of the corresponding collection's form, allowing users to initiate an approval upon submission:


![Initiate Approval_Bind Workflow](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)


After that, when a user submits this form, the corresponding approval workflow will be triggered. The submitted data is not only saved in the corresponding collection but is also snapshotted into the approval flow for subsequent approvers to review and use.

:::info{title=Note}
Currently, the button to initiate an approval only supports the "Submit" (or "Save") button in a create or update form. It does not support the "Trigger workflow" button (which can only be bound to "Custom action event').
:::

## To-do Center

The To-do Center provides a unified entry point for users to view and process their to-do tasks. Approvals initiated by the current user and their pending tasks can be accessed through the To-do Center in the top toolbar, and different types of to-do tasks can be viewed through the navigation on the left.


![20250310161203](https://static-docs.nocobase.com/20250310161203.png)


### My Submissions

#### View Submitted Approvals


![20250310161609](https://static-docs.nocobase.com/20250310161609.png)


#### Directly Initiate a New Approval


![20250310161658](https://static-docs.nocobase.com/20250310161658.png)


### My To-dos

#### To-do List


![20250310161934](https://static-docs.nocobase.com/20250310161934.png)


#### To-do Details


![20250310162111](https://static-docs.nocobase.com/20250310162111.png)


## HTTP API

### Initiator

#### Initiate from Collection

To initiate from a data block, you can make a call like this (using the create button of the `posts` collection as an example):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Here, the URL parameter `triggerWorkflows` is the workflow's key; multiple workflow keys are separated by commas. This key can be obtained by hovering the mouse over the workflow name at the top of the workflow canvas:


![Workflow_Key_View_Method](https://static-docs.nocobase.com/20240426135108.png)


Upon a successful call, the approval workflow for the corresponding `posts` collection will be triggered.

:::info{title="Note"}
Since external calls also need to be based on user identity, when calling via HTTP API, just like requests sent from the regular interface, authentication information must be provided, including the `Authorization` header or the `token` parameter (the token obtained upon login), and the `X-Role` header (the user's current role name).
:::

If you need to trigger an event for one-to-one related data in this action (one-to-many is not yet supported), you can use `!` in the parameter to specify the trigger data for the association field:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Upon a successful call, the approval event for the corresponding `categories` collection will be triggered.

:::info{title="Note"}
When triggering an after-action event via HTTP API, you also need to pay attention to the workflow's enabled status and whether the collection configuration matches; otherwise, the call may not succeed or may result in an error.
:::

#### Initiate from Approval Center

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parameters**

*   `collectionName`: The name of the target collection for initiating the approval. Required.
*   `workflowId`: The ID of the workflow used to initiate the approval. Required.
*   `data`: The fields of the collection record created when initiating the approval. Required.
*   `status`: The status of the record created when initiating the approval. Required. Possible values include:
    *   `0`: Draft, indicates saving without submitting for approval.
    *   `1`: Submit for approval, indicates the initiator submits the approval request, entering the approval process.

#### Save and Submit

When an initiated (or withdrawn) approval is in a draft state, you can save or submit it again through the following API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Get List of Submitted Approvals

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Withdraw

The initiator can withdraw a record currently in approval through the following API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parameters**

*   `<approval id>`: The ID of the approval record to be withdrawn. Required.

### Approver

After the approval workflow enters an approval node, a to-do task is created for the current approver. The approver can complete the approval task through the interface or by calling the HTTP API.

#### Get Approval Records

To-do tasks are approval records. You can get all of the current user's approval records through the following API:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Here, `approvalRecords` is a collection resource, so you can use common query conditions such as `filter`, `sort`, `pageSize`, and `page`.

#### Get a Single Approval Record

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Approve and Reject

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Parameters**

*   `<record id>`: The ID of the record to be approved. Required.
*   `status`: The status of the approval process. `2` for "Approve", `-1` for "Reject". Required.
*   `comment`: Remarks for the approval process. Optional.
*   `data`: Modifications to the collection record at the current approval node after approval. Optional (only effective upon approval).

#### Return <Badge>v1.9.0+</Badge>

Before v1.9.0, returning used the same API as 'Approve' and 'Reject', with `"status": 1` representing a return.

Starting from v1.9.0, returning has a separate API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parameters**

*   `<record id>`: The ID of the record to be approved. Required.
*   `returnToNodeKey`: The key of the target node to return to. Optional. When a range of returnable nodes is configured in the node, this parameter can be used to specify which node to return to. If not configured, this parameter does not need to be passed, and it will default to returning to the starting point for the initiator to resubmit.

#### Delegate

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parameters**

*   `<record id>`: The ID of the record to be approved. Required.
*   `assignee`: The ID of the user to delegate to. Required.

#### Add Signer

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parameters**

*   `<record id>`: The ID of the record to be approved. Required.
*   `assignees`: A list of user IDs to add as signers. Required.
*   `order`: The order of the added signer. `-1` means before "me", `1` means after "me".
