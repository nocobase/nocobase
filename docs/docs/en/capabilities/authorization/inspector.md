---
title: 'Inspect permissions'
description: 'View a user’s permission results, scopes, and sources.'
---

# Inspect permissions

The Permission Inspector helps administrators understand a user's permissions and their sources. For example, Alice has job permissions, a common default scope, and a shared order. The inspector shows how these work together.

## Example: inspect Alice's order permissions

An administrator with inspection permission opens Settings → Authorization → Permission Inspector, selects Alice Miller, opens the Order approvals section, and clicks View orders for details.

![Select Alice and inspect order permissions](../../../cn/capabilities/authorization/assets/inspector.png)

The result shows permission sets, record scopes, and rule sources. Here, Order applicant grants View orders, default scope includes approved orders, sharing adds PO-2026-004, and a restriction allows orders up to CNY 2,000.

![View order scopes and rule sources](../../../cn/capabilities/authorization/assets/inspector-details.png)

## Adjust configuration by source

Change the permission set for job responsibilities, default scope for common records, sharing for collaboration, and restrictions for conditions such as a budget. The inspector displays results; make changes on each corresponding Settings page.

Inspection describes grants and conditions rather than counting accessible records. Select the user for their actual permissions. Selecting a team describes permissions assigned to that team itself.

System administrators have unrestricted access. Select the corresponding employee account to inspect a business job's results.
