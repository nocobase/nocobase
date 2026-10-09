---
title: 'Authorization'
description: 'Assign capabilities by job and provide access to the data each user needs.'
---

# Authorization

Authorization determines which pages a user can enter, which actions they can perform, and which records they can access. For example, purchase requesters view their own orders, reviewers process approvals, and application administrators manage assignments. Applications can reuse these capabilities to define business responsibilities.

## Available capabilities

| Capability                                           | Purpose                                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| [Permission sets and assignments](./permission-sets) | Combine page access, actions, and data scopes into reusable job responsibilities |
| [Data scopes and rules](./data-scopes)               | Select records for an action, such as orders requested by the current user       |
| [Default data scope](./default-access)               | Provide a common record scope for users who already have an action               |
| [Sharing rules](./sharing-rules)                     | Give selected collaborators access to additional records                         |
| [Restriction rules](./restriction-rules)             | Narrow the accessible record scope                                               |
| [Permission Inspector](./inspector)                  | View a user's permissions and their sources                                      |

[Authentication](../auth) identifies the user; authorization determines what that user can do. Requiring sign-in for orders is authentication. Restricting requesters to their own orders is authorization.

## Integration and administration

Your development Agent connects application pages, business actions, and record scopes to authorization. For example, orders can provide View orders, Process approvals, and Orders requested by me. Administrators then configure permission sets, assign people, and adjust rules in Settings → Authorization.

The default application template includes permission sets, the inspector, and the three record-rule capabilities. The following pages use purchase orders to explain business requirements, administration, and visible results. Adapt the prompts to your application.
