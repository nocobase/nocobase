---
title: 'Sharing rules'
description: 'Let selected people collaborate on records beyond their regular responsibilities.'
---

# Sharing rules

Sharing rules provide additional records for temporary collaboration or handover. For example, Bob can ask Alice to review an order by sharing viewing access to that order.

## Example: a colleague reviews an order

Alice already has View orders permission and normally views her own orders. She now needs to review a pending order from Bob:

```text
Share Bob's PO-2026-004 with Alice so she can review it.
Alice already has View orders permission; add viewing access to this order.
Keep her existing responsibilities. Order reviewers still process approvals.
Let administrators manage this sharing rule in Settings.
```

In Settings → Authorization → Sharing Rules, administrators create a rule, select the order-viewing action, choose the order, and select Alice as the recipient.

![Choose the shared order and recipient](../../../../cn/capabilities/authorization/assets/sharing-rule.png)

### View the result

Alice opens the order list and can view Bob's PO-2026-004. Her existing records remain available under their current rules.

![Alice views a pending order shared by her colleague](../../../../cn/capabilities/authorization/assets/shared-orders.png)

## After collaboration

Administrators can adjust or delete the rule. Sharing adds a record scope; recipients still need the corresponding page and action permissions. If collaboration requires editing or approval, describe those responsibilities and configure the scope for each action.

Applications with integrated teams or departments can also assign rules to those subjects.
