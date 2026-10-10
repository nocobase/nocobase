---
title: 'Default data scope'
description: 'Provide common reference records to people who already have the relevant action.'
---

# Default data scope

Default data scope provides a common set of records to users who already hold an action. For example, requesters normally view their own orders and can also consult approved orders as purchase references.

## Example: consult approved orders

```text
Keep requesters able to view their own orders.
Let everyone with View orders permission also consult approved orders as purchase references.
Configure these common records as a default data scope that administrators can adjust in Settings.
```

In Settings → Authorization → Default Data Scope, configure Approved orders for View orders. This example extends reading while keeping approval responsibilities unchanged.

![Configure approved orders as the default viewing scope](../../../cn/capabilities/authorization/assets/default-access.png)

### View the result

Alice's list includes her orders and Bob's approved PO-2026-003. Other users with View orders permission can consult the same reference records.

![A requester consults another person's approved order](../../../cn/capabilities/authorization/assets/default-access-orders.png)

## Adjust the common scope

Default scope combines with the job's existing scope instead of replacing it. Administrators can change the common-record condition; configure different actions for a resource within the same default rule.

Use [sharing rules](./sharing-rules) when only selected people need additional records. Reading, editing, and approval scopes can be configured separately.
