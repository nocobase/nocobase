---
title: 'Time limits and external coordination'
---

# Time limits and external coordination

After the basic transport flow, address unhandled tasks and results from other systems. Describe these requirements to the Agent using the same business language.

## Remind employees about acceptance delays

Remind users about unhandled work and escalate after agreed deadlines. Keep reminders separate from actual handling so a message does not count as completion.

```text
Remind the assigned driver after 30 minutes without acceptance. After 60 minutes, notify the dispatcher and supervisor.
Do not treat a reminder as acceptance or send the same reminder repeatedly.
Flag overdue transport for dispatcher follow-up. Continue checking unfinished orders after application restart and retain handling records.
```

Employees should see a reminder linked to the order while the order remains awaiting action. Background processing must continue after closing the page. This is an extension requirement; the current transport screenshots do not demonstrate automatic timeout reminders.

## Notify the account manager after delivery

Notify relevant users after handling is saved. Retry failed delivery independently rather than losing the saved business result.

```text
Notify the responsible account manager when the driver submits delivery evidence. Link the message to the order.
Save delivery and evidence first. If notification fails, retain its reason and retry without reverting the order to In transit.
Show notification results and assign final failures to a responsible employee.
```

The shipment can be delivered while its notification is still pending. Preserve delivery evidence and give employees a place to inspect message results.

[Notifications](../notification.md) includes actual Northstar messages and delivery logs that can support this integration. That demonstration is separate from the automatic delivery notification requested here.

## Wait for external results

An invoice provider may return its file after the request. Show a waiting stage, then save the invoice number and file before notifying the applicant.

```text
Add invoicing for completed orders. Collect company name and tax ID, then submit to the invoice provider.
Retry failed submission up to three times before assigning finance follow-up. Query if no result arrives within ten minutes.
Do not issue duplicate invoices or let repeated or late events overwrite completed results.
Show progress, failures, invoice files and external processing records.
```

A real integration requires connectivity, credentials and callback or query APIs. The current demonstration has not integrated a real invoice provider.

## Further business requirements

These are future requirements within the transport background, not implemented demonstrations. See [Quick start](./quick-start.md) for the actual transport results.

| Requirement                  | Rules to add                                                                                   | Employee-facing result                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Monthly report export        | Query every 30 seconds; stop after ten minutes without completion                              | Progress, download or failure reason                 |
| Vehicle or space reservation | Release after later confirmation fails; retry release and escalate                             | Reservation and release status, responsible employee |
| Delivery agreement renewal   | Retry payment daily; follow agreed suspension after three failures; cancellation at period end | Validity, overdue payment and next processing time   |
| Warehouse and fee readiness  | Require both conditions without a fixed order                                                  | Fulfilled conditions and outstanding responsibility  |
| Carrier tracking             | Validate sources, deduplicate events and ignore obsolete progress                              | Latest valid tracking and processing records         |
| Transport exception ticket   | Close after 72 hours awaiting a customer; reopen within seven days; explain reassignment       | Conversation, handler, deadline and reopening entry  |

## Change an active flow

When changing a flow with unfinished records, plan how those records continue. Preserve compatible handling paths during deployment.

```text
Add handover confirmation before departure. Analyze continuation for existing orders first.
Preserve handling paths for unfinished orders and explain compatibility and deployment.
For a stalled order, inspect its stage, assignment, history and external processing records before proposing corrections.
```

Plan how existing orders continue and retain saved results before updating the flow. See [Developer reference](./extension.md) when reviewing implementation APIs.
