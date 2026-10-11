---
title: 'Quick start'
---

# Quick start

Add handling stages to the existing Northstar orders from [Quick start](../quick-start.md). Complete one order first, then add time limits and external coordination.

## 1. Describe the business flow

```text
Add a handling flow to existing Northstar transport orders.
Assign a driver while awaiting dispatch, then await acceptance. Accepting and departing starts transport.
Rejecting an assignment requires a reason, returns to dispatch and clears the assignment.
Submitting delivery evidence marks delivery; supervisor confirmation completes the order.
Allow cancellation with a reason before departure. Define a separate exception process after departure.
Show current stages, available actions, reasons an action is unavailable, and handling history in order details.
Preserve actors, timestamps, previous and next stages and submitted information after refresh.
Ordinary editing must not directly change the stage; enforce inputs, current stage and conditions on the server.
Propose the stage table and unresolved business rules first, then implement after confirmation.
```

Acceptance and departure are one action here. Add a separate departure stage before implementation if the business requires it.

## 2. Confirm the order

| Current stage                   | Action                   | Next stage          |
| ------------------------------- | ------------------------ | ------------------- |
| Awaiting dispatch               | Assign driver            | Awaiting acceptance |
| Awaiting acceptance             | Accept and depart        | In transit          |
| Awaiting acceptance             | Reject with a reason     | Awaiting dispatch   |
| In transit                      | Submit delivery evidence | Delivered           |
| Delivered                       | Confirm delivery         | Completed           |
| Awaiting dispatch or acceptance | Cancel with a reason     | Cancelled           |

Confirm who can view orders and perform each action, and which inputs are required. Integrate jobs and record scopes with [Authorization](../authorization/index.md).

## 3. Open an order awaiting action

Open **NS-2026-003** in **Orders**. In this earlier screenshot it has an assigned driver and is **Awaiting acceptance**. **Transport process** shows its stage and acceptance, rejection and cancellation actions.

![Order awaiting acceptance](../assets/northstar-process-before-en.png)

## 4. Handle the order and see its result

Use **Accept and depart**, submit delivery evidence, then confirm delivery. The order becomes **Completed**. **Processing history** preserves the three actual actions, timestamps, stages and evidence reference.

![Completed order and handling history](../assets/northstar-process-completed-en.png)

These screenshots show an administrator completing the business actions. Employee use also requires the corresponding page, action and record-scope permissions.

Progress and history remain after refresh. Other application entry points should use the same handling rules rather than editing the stage directly.

## Next steps

Add [Reminders and external coordination](./automation.md) as needed. For multi-person decisions, see [Approval](../approval/index.md).
