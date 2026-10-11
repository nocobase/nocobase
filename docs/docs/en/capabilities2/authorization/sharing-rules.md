---
title: 'Sharing rules'
---

# Sharing rules

Sharing adds record scope for selected people or registered organizational subjects. Recipients still need the corresponding page and action permissions.

## Temporary collaboration

Temporary collaboration may require access to specific records without broadening a person’s whole job scope. Share the selected records while preserving ownership and regular permissions.

```text
Alice needs Bob to help follow up transport order NS-2026-001.
Bob already has order viewing permission; share this order's viewing scope with him.
Keep Alice as owner and preserve Bob's normal job and owned-record scope.
Do not grant editing, driver assignment, or approval through this sharing.
Let administrators select an employee and order in Access rules, save a view-only sharing rule, and remove it after collaboration ends.
```

Bob views the collaboration order in the existing orders page alongside his existing scope. Sharing does not change ownership.

## Specify actions

Share viewing for review-only collaboration. Editing requires its own permission and scope. Sharing cannot bypass applicable restrictions.

Removing a rule removes that source, but other job, default, or sharing sources may remain. Use [inspection](./inspector.md) to understand the result.

Sharing with teams or departments requires registered subjects and real membership.

## Select an employee and order

Open **Access rules → Order sharing**, select Bob and Alice’s **NS-2026-001**, then click **Save rule**. Current rules show the recipient, order and view operation. Removing a rule requires confirmation.

![Share Alice’s order with Bob](../assets/northstar-sharing-config-en.png)

**The sharing rule gives Bob viewing access to the selected order.**

## See the recipient’s result

With only his job scope, Bob sees four orders. Sharing adds NS-2026-001, bringing the list to five; its owner remains Alice.

![Bob’s orders before sharing](../assets/northstar-sharing-before-en.png)

**Before sharing, Bob sees his four orders.**

![Bob sees Alice’s shared order](../assets/northstar-sharing-after-en.png)

**After sharing, Bob sees Alice’s selected order without changing its owner.**

These results show sharing before adding common access and fee limits. Sharing does not grant editing or dispatch permissions.
