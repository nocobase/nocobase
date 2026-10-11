---
title: 'Quick start'
---

# Quick start

Start with basic order processing before adding notifications, integrations, and complex approvals. Use existing customers, drivers, and orders instead of building another application.

## Confirm stages first

```text
Add a business workflow to Northstar's existing transport orders. Do not write code yet.
A dispatcher assigns a driver, moving an order from awaiting dispatch to awaiting acceptance.
The assigned driver accepts and departs to enter in transit. Declining requires a reason and returns the order to dispatch without the previous assignment.
The assigned driver submits delivery evidence to enter delivered; an operations lead verifies it to complete the order.
Account managers or dispatchers may cancel before departure with a reason, but not after transport starts.
Provide a stage table, diagram, and missing decisions, including viewing and processing permissions.
```

Check that every unfinished stage has an exit, driver operations belong to the assigned person, and delivery inputs are explicit. This example combines acceptance and departure; change the table first if they must be separate.

## Implement processing and pages

```text
Implement the confirmed stages using workflow and authorization capabilities.
Show the diagram, available operations, unavailable reasons, and history in order details.
Collect inputs for assignment, cancellation, decline, and delivery.
Prevent ordinary edits and APIs from directly changing stages.
Provide dispatcher and personal driver tasks that update after processing.
Explain where each role starts and how to complete an order.
```

## Complete an order

| Role            | Action            | Result                                   |
| --------------- | ----------------- | ---------------------------------------- |
| Dispatcher      | Assign driver     | Awaiting acceptance, assignment recorded |
| Assigned driver | Accept and depart | In transit, actor and time recorded      |
| Assigned driver | Submit evidence   | Delivered, evidence linked               |
| Operations lead | Verify delivery   | Completed, history retained              |

Use the same server processing rules across pages and APIs. Editing a status field is not processing.

## View processing results

Transport process shows the current stage. NS-2026-003 has an assigned driver and is awaiting acceptance, with departure, decline, and cancellation available.

![Available actions on an order awaiting acceptance](../assets/northstar-process-before-en.png)

After departure, submission of a receipt reference, and verification, the order is Completed. Processing history retains the actual actions, times, stages, and receipt reference after refreshing.

![Completed transport order with persisted processing history](../assets/northstar-process-completed-en.png)

## Before delivery

Ask the Agent for evidence covering role conditions, inputs, branches, duplicate submission, concurrency, quality checks, and builds. Add deadline and integration checks as those rules are introduced. A page walkthrough demonstrates use; it does not replace release checks.
