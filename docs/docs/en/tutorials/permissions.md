---
title: '3. Add permissions'
description: 'Configure salesperson and supervisor access and test record isolation.'
---

# 3. Add permissions

Use two Permission Sets: Tutorial salesperson and Tutorial supervisor.

| Action                            | Salesperson                  | Supervisor                   |
| --------------------------------- | ---------------------------- | ---------------------------- |
| Open order list and detail pages  | Allowed                      | Allowed                      |
| Read orders                       | Own orders                   | All orders                   |
| Create orders                     | Owned by the signed-in user  | Owned by the signed-in user  |
| Submit                            | Own draft or rejected orders | Own draft or rejected orders |
| Approve, reject, dispatch results | Denied                       | Allowed                      |

Customers are shared reference data in this exercise, maintained by an administrator. A supervisor must still follow the order state rules.

## Goal and starting point

The list and details already use the database. Now prepare separate accounts and distinguish page access, allowed operations, and accessible records.

## Three authorization concerns

| Concern      | Order example                            | Check                                             |
| ------------ | ---------------------------------------- | ------------------------------------------------- |
| Page access  | Can this user enter Tutorial orders?     | Use the menu and open the URL directly            |
| Operations   | Can this user approve or reject?         | Check both buttons and direct API requests        |
| Record scope | Can this user see only their own orders? | Create data as A and B, then exchange detail URLs |

A Permission Set groups grants for assignment to multiple users. Order ownership comes from `ownerId`, matched against the signed-in user's ID. The same salesperson Permission Set therefore gives A and B access to different records.

## Connect authorization

```text
Read the Authorization and Users Skills. Use the existing permission system for tutorial orders; do not create another roles table.

Register tutorialOrders with read, create, and update actions; DB metadata supplies its fields. Use ownerId for ownership. Register list/detail pages separately from business actions such as view, submit, approve and reject, and declare the fields each operation can use.

Create Tutorial salesperson and Tutorial supervisor Permission Sets. Use recordsIOwn for salesperson read/update and allRecords for the supervisor. Allow only the necessary input and output fields. Set ownerId from the signed-in identity on creation.

For a business action, call the request scope’s authorize() once and bind its conditions.database policies with repository.withPolicy(). Use db.policyFor() for ordinary collection CRUD. Hiding menus or filtering all records in the browser is insufficient.

Reserve supervisor access for decision actions. Submission must also check ownership. Show allowed actions in the UI and independently authorize them on the server.
```

For the full design workflow, see [Describe permissions to AI](../capabilities/authorization/develop-with-ai).

The database resource ID is `tutorialOrders`. Match Permission Set grants, route resource names, and API checks; a translated display title is not a resource ID.

## Create test accounts

As an administrator, open Settings → Users, create salesperson A, salesperson B, and a supervisor, then assign the corresponding roles. Choose your own test passwords.

![Three test users with salesperson and supervisor roles; Chinese interface](https://static-docs.nocobase.com/nb3-docs-20260916-tutorial-users.png)

## Test with separate accounts

Create `SO-A01` as salesperson A and `SO-B01` as salesperson B. Each salesperson should see only their own order; the supervisor should see both.

Copy A's detail URL into B's browser. B must not receive its contents. Ask the AI Agent to test direct API requests too: anonymous reads return `401`, forbidden operations are denied, and out-of-scope details do not reveal order data.

In the next chapter, also test a salesperson's forged approval request. A hidden Approve button is not a security boundary.
