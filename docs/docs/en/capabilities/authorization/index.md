---
title: 'Authorization'
---

# Authorization

Authorization determines which pages employees enter, which actions they perform, and which records they access. Northstar account managers maintain transport demand, dispatchers assign drivers, and drivers handle their own tasks in one application.

[Authentication](../auth/index.mdx) establishes identity. Requiring sign-in for orders is authentication; allowing a driver to handle only assigned tasks is authorization.

## Start from responsibilities

| Job                       | Pages and actions                               | Record scope                               |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Account manager           | Customers, order creation and editing           | Customers and orders owned by the employee |
| Dispatcher                | Dispatch workspace and driver assignment        | Orders needed for coordination             |
| Driver                    | Tasks, acceptance, departure, delivery evidence | Assigned tasks                             |
| Operations lead           | Transport monitoring and special transport      | Orders and requests within responsibility  |
| Finance lead              | Settlement details and extra-fee review         | Authorized financial records               |
| Application administrator | Assignments and access rules                    | Administrative responsibility              |

The application declares pages, actions, and scopes; authorization calculates access. Record state remains a separate requirement: driver assignment permission does not make a completed order assignable.

## In this section

| Capability                                              | Purpose                                           |
| ------------------------------------------------------- | ------------------------------------------------- |
| [Permission sets and assignments](./permission-sets.md) | Reusable job responsibilities                     |
| [Data scopes and rules](./data-scopes.md)               | Owned, assigned, all, and conditional records     |
| [Default data access](./default-access.md)              | Shared baseline scope for existing action holders |
| [Sharing rules](./sharing-rules.md)                     | Additional records for selected collaborators     |
| [Restriction rules](./restriction-rules.md)             | Narrow existing access                            |
| [Inspecting permissions](./inspector.md)                | Results, conditions, and sources                  |

## Business-oriented administration

Administrators need to update jobs and access rules as people join, change responsibilities or collaborate. Provide a business-oriented entry for maintaining supported configurations.

Northstar can provide a Team access entry using authorization capabilities without retaining a shared Settings page.

```text
Provide Team access for authorized Northstar administrators.
Define jobs for account managers, dispatchers, drivers, operations leads, and finance leads.
Specify pages, actions, and record scopes, enforced on the server.
Support assignments, default scope, temporary sharing, restrictions, and permission source inspection.
Use business names; do not merely display role labels without enforcing access.
```

## See the result

Alice and Bob have an account manager job scoped to their own orders. Dispatcher Emma can view all orders. Administrators configure common access, sharing and fee limits in Access rules; employees see their results in the existing order page. Ordinary account managers do not see the administration entry.

![Configure order sharing and its recipient](../assets/northstar-sharing-config-en.png)

**The sharing rule gives Bob viewing access to the selected order.**
