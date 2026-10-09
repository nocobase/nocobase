---
title: 'Permission sets and assignments'
description: 'Configure pages, business actions, and data scopes for a job, then assign people.'
---

# Permission sets and assignments

A permission set combines permissions into reusable job responsibilities. A purchase requester can view their own orders, while a reviewer can view orders and process approvals. Assign the same set to employees with the same responsibilities.

## Example: purchase requesters and reviewers

The procurement application needs two jobs. Ask your development Agent:

```text
Create Purchase requester and Order reviewer jobs for the procurement application.
Purchase requesters can enter the orders page and view orders they requested.
Order reviewers can enter the orders page, view orders, and approve or reject pending orders.
Only application administrators can change permissions and assignments.
Use the application's existing authorization capability so administrators can adjust permissions and assign people in Settings later.
```

After integration, administrators open a job in Settings → Authorization → Permission Sets. Permissions have three parts:

| Part                 | Configuration in this example                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Page permissions     | Access to the orders page                                                                                    |
| Business permissions | Requesters view orders; reviewers view orders and process approvals                                          |
| Administration       | Administrators manage configuration; business jobs receive permissions appropriate to their responsibilities |

In Business permissions, click the scope icon beside View orders, choose Orders requested by me, and save. Reviewers can view orders required for their work; approval controls appear only on pending orders.

![Configure the requester's order action and record scope](../../../../cn/capabilities/authorization/assets/permission-set.png)

### Assign people

Add people on the permission set's Assignees page. This example assigns Alice Miller and Bob Carter as requesters, and Emma Wilson as an order reviewer.

![Assign the purchase requester permission set to people](../../../../cn/capabilities/authorization/assets/assignments.png)

### View the results

Alice signs in to view her orders. Emma signs in to view orders and process pending approvals. Permissions define responsibilities; business state determines whether an order is currently eligible for approval.

![A requester views her own orders](../../../../cn/capabilities/authorization/assets/requester-orders.png)

![A reviewer views pending orders and approval controls](../../../../cn/capabilities/authorization/assets/reviewer-orders.png)

Open pending order PO-2026-004 to view its details. Emma can use Approve or Reject to process it.

![A reviewer processes approvals in the order details](../../../../cn/capabilities/authorization/assets/reviewer-order-details.png)

## Adjust and reuse

Administrators can adjust the set and assign it to new employees. Users can hold multiple permission sets. Team and department assignments require integration with the application's organization and membership model.

The default Member set applies to all signed-in users and suits common basic capabilities. Use dedicated sets for everyday jobs and the system administrator for application management.
