---
title: 'Data scopes and rules'
description: 'Choose accessible records using ownership, all records, or business conditions.'
---

# Data scopes and rules

A data scope determines which records a business action can process. Users may share View orders permission while requesters see their own orders and reviewers see the orders they need to process.

## Example: requesters view their own orders

```text
Let purchase requesters view only their own orders, using the order's requester field to determine ownership.
Order reviewers can view all orders and process pending approvals.
Administrators can adjust each job's order-viewing scope in its permission set.
```

Your Agent connects the order requester to the signed-in user and provides the appropriate scope. In the requester's business permissions, administrators choose Orders requested by me for View orders.

![Choose orders requested by the current user](../../../../cn/capabilities/authorization/assets/data-scope.png)

Alice's order list shows her orders, while Bob's shows his. The same page returns different data according to each user's permissions.

![Alice's list shows orders she requested](../../../../cn/capabilities/authorization/assets/requester-orders.png)

## Choose scopes for responsibilities

| Scope                  | Appropriate responsibility                              |
| ---------------------- | ------------------------------------------------------- |
| Orders requested by me | A requester views their own orders                      |
| All orders             | A person responsible for coordinating orders            |
| Business conditions    | Pending approvals or orders within an amount range      |
| Department or team     | Applications with integrated organization relationships |

The application provides available scopes. Requested by me refers to the order's requester, which may differ from the record creator. Tell your Agent which business field to use.

## Extend scopes with rules

Use [default data scope](./default-access) for common reference records, [sharing rules](./sharing-rules) for selected collaborators, and [restriction rules](./restriction-rules) to narrow results. These rules adjust record scopes; permission sets still assign page access and actions.
