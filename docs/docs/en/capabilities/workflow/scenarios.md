---
title: 'Scenarios'
description: 'Typical business scenarios: the prompt to give the Agent, what it builds, and the process capabilities each one uses.'
---

# Scenarios

Each scenario gives the prompt to hand the Agent, what it builds, and which process capabilities it uses. Adapt the prompts to your own business and use them directly; each one asks the Agent for a step table and a diagram before writing code. The development steps are in [Develop with an Agent](./develop.md).

| Scenario                                      | Main difficulty                                          |
| --------------------------------------------- | -------------------------------------------------------- |
| [E-invoicing](#e-invoicing)                   | Waiting for a callback, and querying when it is late     |
| [Data export](#data-export)                   | The other side never notifies, so it has to be polled    |
| [Flash-sale order](#flash-sale-order)         | Undoing an earlier step when a later one fails           |
| [Subscription renewal](#subscription-renewal) | Moving by period, and retrying regularly after a failure |
| [Shipping](#shipping)                         | Waiting for two things, and ignoring stale notifications |
| [Support ticket](#support-ticket)             | Alternating actions and waits, reopening within a limit  |

## E-invoicing

A customer requests an invoice on a completed order, and an external invoicing platform issues it.

**What it builds**: the invoice detail page shows the diagram, the current step and the history; once issued, the PDF can be downloaded; when issuing fails, finance sees the reason and a "Reissue" button.

**Capabilities used**: waiting for an external callback, querying after a timeout, automatic retries on failure, never issuing the same invoice twice.

```text
Use NocoBase's process capability (@nocobase/lifecycle) to build a process for issuing e-invoices for orders. Give me a step table and a diagram first, and write code after I confirm them.

A customer requests an invoice on a completed order, entering the title and tax number. The system submits the request to the invoicing platform: a failed submission is retried 3 times, and if it still fails it moves to "issue failed", where finance can retry by hand. After a successful submission it waits for the platform's callback, which carries the invoice number and PDF URL; on receipt they are saved on the invoice and the customer is notified. If no callback arrives within 10 minutes, query the platform for the result once. However many retries there are, the platform issues only one invoice; a callback delivered more than once counts once.
```

## Data export

An export is handed to an external service that never reports its result.

**What it builds**: the export list shows each task's progress and current step; finished tasks have a download link, and tasks that timed out show the reason.

**Capabilities used**: polling external progress, an overall deadline, telling the external side to stop after a timeout.

```text
Use NocoBase's process capability (@nocobase/lifecycle) to build a process for data export. Give me a step table and a diagram first, and write code after I confirm them.

After a user submits an export, the system hands the task to an external export service, which never reports its result. Query its progress every 30 seconds and show it on the page; when it finishes, save the download URL and notify the user; if it has not finished 10 minutes after submission, mark it failed, tell the external service to stop the task, and tell the user why it failed.
```

## Flash-sale order

Stock is reserved before payment is taken, and a failed payment has to return the stock.

**What it builds**: the order history clearly shows "stock reserved → payment failed → stock released"; if releasing also fails, the order stops at "awaiting manual release", and operations retries it from the admin page with one click.

**Capabilities used**: several pieces of external work in order, undoing completed work after a failure, stopping for a person when the undo also fails.

```text
Use NocoBase's process capability (@nocobase/lifecycle) to build a process for flash-sale orders. Give me a step table and a diagram first, and write code after I confirm them.

When a customer orders, first reserve stock in the warehouse system, and take payment once the reservation succeeds. If payment succeeds, the order completes; if payment is declined, release the reserved stock and the order is cancelled. Releasing is retried at most 3 times, and if it still fails the order stops at "awaiting manual release", where operations can retry it from the admin page. No call to an external system may be executed twice.
```

## Subscription renewal

Payment is taken automatically each period, and a failed payment is collected later.

**What it builds**: the subscription detail page shows the current period, the next payment date, whether payment is overdue, and a record of every charge.

**Capabilities used**: moving by a date on the record, retrying regularly after a failure, cancelling automatically after repeated failures.

```text
Use NocoBase's process capability (@nocobase/lifecycle) to build a process for subscription renewal. Give me a step table and a diagram first, and write code after I confirm them.

After a user subscribes, payment is taken automatically each month on the subscription day, and success starts the next period. A failed payment moves to "payment overdue" and is retried once a day; when the user updates their card, retry at once; after 3 consecutive failures, cancel the subscription automatically and notify the user. The user can cancel at any time, and the subscription stops at the end of the current period.
```

## Shipping

Shipping waits for both payment and picking to finish, and the courier platform pushes tracking events.

**What it builds**: the shipment detail page shows whether each of the two preconditions is done, and the tracking events in time order.

**Capabilities used**: waiting for several external results in any order, handling notifications by when they happened, ignoring stale notifications.

```text
Use NocoBase's process capability (@nocobase/lifecycle) to build a process for shipping. Give me a step table and a diagram first, and write code after I confirm them.

Shipping waits for two things: the payment platform confirming payment and the warehouse finishing picking, which can arrive in either order; once both are done it moves to awaiting handover. After handover to the courier, the courier platform pushes tracking events such as picked up, in transit, out for delivery and delivered; handle them by the time they happened, and ignore a push older than the latest recorded event; on delivery, shipping completes and the customer is notified.
```

## Support ticket

Support works on a customer's problem and waits for the customer's replies along the way.

**What it builds**: the ticket detail page shows the whole conversation in time order; buttons that cannot be used are greyed out with the reason, such as "The reopen period has passed".

**Capabilities used**: alternating human actions and waits, closing automatically on timeout, reopening within a limit, saying why an action is not available.

```text
Use NocoBase's process capability (@nocobase/lifecycle) to build a process for support tickets. Give me a step table and a diagram first, and write code after I confirm them.

After the customer submits a ticket, it awaits assignment; an agent picks it up from the queue, or a supervisor assigns it. When the agent replies to the customer, it moves to "awaiting customer reply", and returns to in progress when the customer replies. The agent can mark it resolved; if the customer does not reply within 72 hours it closes automatically; within 7 days of closing the customer can reopen it, and after 7 days the button is greyed out with "The reopen period has passed". Only the ticket's assignee can reply and mark it resolved; a supervisor can reassign it, and reassigning requires a reason. When the agent replies, email the customer, retrying automatically on failure. The ticket detail shows the whole conversation in time order.
```

## Work handled by several people

When a step needs several people together — countersigning, any-one-of approval, several people acting separately and then combined, adding approvers — it is easier to build with the [approval plugin](../approval.md).
