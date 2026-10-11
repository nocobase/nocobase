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

The screenshots below show one implementation in the example application’s workflow pages. Invoicing, payments, stock and the carrier are simulated by sandboxes. Some timeouts are shorter than those in the prompts to make the examples easier to try.

## E-invoicing

A customer requests an invoice on a completed order, and an external invoicing platform issues it.

**What it builds**: the invoice detail page shows the diagram, the current step and the history; once issued, the PDF can be downloaded; when issuing fails, finance sees the reason and a "Reissue" button.

**Capabilities used**: waiting for an external callback, querying after a timeout, automatic retries on failure, never issuing the same invoice twice.

Open **Workflow → E-invoicing**. Three drafts demonstrate successful invoicing, submission failure and a callback timeout. Order references, customers and amounts come from completed sandbox orders in a separate demonstration order catalog. Run `pnpm nocobase db sample` if the samples have not been loaded.

Select the invoice for order #1024, titled “星河科技有限公司”, click **Request invoice**, then **Issue successfully** in **Invoicing platform (sandbox)**. After the notification arrives, the page stores the provider request and invoice numbers and offers a sample PDF download. The PDF is marked as a sandbox demonstration and is not valid for tax use. **Deliver again** resends the same notification, which is processed only once.

![Invoice issued with its invoice number and demonstration PDF download](https://static-docs.nocobase.com/invoice-issued-44bcc68532e60ba7.png)

Submit the sample for order #1025, titled “晨光书店有限公司”. This sample deliberately fails submission three times and shows the reason. Click **Retry invoice** to continue.

![Three failed submission attempts followed by an available manual retry](https://static-docs.nocobase.com/invoice-failed-6fbd81574d42e659.png)

![Retrying the same invoice record returns it to awaiting issue](https://static-docs.nocobase.com/invoice-retry-8a2d53f0f88a854e.png)

Submit the invoice for order #1026, select **Hold the webhook**, then click **Issue successfully**. The platform has issued the invoice, but the application has not received the notification. After 30 seconds, the example queries the result, shows the query count and moves to Issued; the prompt below specifies 10 minutes. Delivering the held notification later does not issue another invoice.

![Invoice issued at the platform while the application waits for the held callback](https://static-docs.nocobase.com/invoice-held-d994198ebe245d00.png)

![Query after the callback timeout retrieves the invoice number and PDF](https://static-docs.nocobase.com/invoice-queried-49252fc060aabec5.png)

```text
I want to build a process in the current application for issuing e-invoices for orders. Give me a step table and a diagram first, and write code after I confirm them.

A customer requests an invoice on a completed order, entering the title and tax number. The system submits the request to the invoicing platform: a failed submission is retried 3 times, and if it still fails it moves to "issue failed", where finance can retry by hand. After a successful submission it waits for the platform's notification, which carries the invoice number and PDF URL; on receipt they are saved on the invoice and the customer is notified. If no notification arrives within 10 minutes, query the platform for the result once. However many retries there are, the platform issues only one invoice; a notification delivered more than once counts once.
```

## Data export

An export is handed to an external service that never reports its result.

**What it builds**: the export list shows each task's progress and current step; finished tasks have a download link, and tasks that timed out show the reason.

**Capabilities used**: polling external progress, an overall deadline, telling the external side to stop after a timeout.

Under **Workflow → Data exports**, select “9 月订单明细” and click **Start export**. The task shows its current step, poll count and deadline; progress reflects the last query result. The example polls every 15 seconds and gives up after 3 minutes, compared with 30 seconds and 10 minutes in the prompt below.

![Export processing with its poll count, deadline and last queried progress](https://static-docs.nocobase.com/export-processing-19f5f7ad7dc3494a.png)

Once complete, the page shows the result URL and 100% progress. The example URL is a sandbox URL; a real application needs an actual export service and a working download link.

![Completed export showing the result URL and full progress](https://static-docs.nocobase.com/export-completed-cee3d4b02ec8cbc7.png)

```text
I want to build a process in the current application for data export. Give me a step table and a diagram first, and write code after I confirm them.

After a user submits an export, the system hands the task to an external export service, which never reports its result. Query its progress every 30 seconds and show it on the page; when it finishes, save the download URL and notify the user; if it has not finished 10 minutes after submission, mark it failed, tell the external service to stop the task, and tell the user why it failed.
```

## Flash-sale order

Stock is reserved before payment is taken, and a failed payment has to return the stock.

**What it builds**: the order history clearly shows "stock reserved → payment failed → stock released"; if releasing also fails, the order stops at "awaiting manual release", and operations retries it from the admin page with one click.

**Capabilities used**: several pieces of external work in order, undoing completed work after a failure, stopping for a person when the undo also fails.

Under **Workflow → Flash sale**, select “机械键盘 × 1” and click **Place order**. This sample deliberately declines the card: the steps show successful stock reservation, a failed charge and successful stock release. The purchase becomes Cancelled and the warehouse's reserved quantity returns to 0.

![Stock reservation compensated after a declined payment](https://static-docs.nocobase.com/purchase-compensated-28a1a04bfbf90947.png)

```text
I want to build a process in the current application for flash-sale orders. Give me a step table and a diagram first, and write code after I confirm them.

When a customer orders, first reserve stock in the warehouse system, and take payment once the reservation succeeds. If payment succeeds, the order completes; if payment is declined, release the reserved stock and the order is cancelled. Releasing is retried at most 3 times, and if it still fails the order stops at "awaiting manual release", where operations can retry it from the admin page. No call to an external system may be executed twice.
```

## Subscription renewal

Payment is taken automatically each period, and a failed payment is collected later.

**What it builds**: the subscription detail page shows the current period, the next payment date, whether payment is overdue, and a record of every charge.

**Capabilities used**: moving by a date on the record, retrying regularly after a failure, cancelling automatically after repeated failures.

Under **Workflow → Subscriptions**, click **Subscribe** above the list and expand **Demo options**. Set how many charges the card declines to test payment recovery and retries. This screenshot shows the form before submission. The example period is 3 minutes and retries occur every minute; the prompt below specifies monthly charges and daily retries.

![Subscription form with customer, plan and demonstration card decline options](https://static-docs.nocobase.com/subscription-options-d3c2f63f07fbc61c.png)

```text
I want to build a process in the current application for subscription renewal. Give me a step table and a diagram first, and write code after I confirm them.

After a user subscribes, payment is taken automatically each month on the subscription day, and success starts the next period. A failed payment moves to "payment overdue" and is retried once a day; when the user updates their card, retry at once; after 3 consecutive failures, cancel the subscription automatically and notify the user. The user can cancel at any time, and the subscription stops at the end of the current period.
```

## Shipping

Shipping waits for both payment and picking to finish, and the courier platform pushes tracking events.

**What it builds**: the shipment detail page shows whether each of the two preconditions is done, and the tracking events in time order.

**Capabilities used**: waiting for several external results in any order, handling notifications by when they happened, ignoring stale notifications.

Under **Workflow → Shipping**, open a shipment that is preparing. Payment confirmation and picking time are initially empty. Send **Payment captured** and **Warehouse picked** from the sandbox in either order; both signals must arrive before the shipment can be handed to the carrier. The carrier panel lets you set the scan time and hold events to test late or out-of-order notifications.

![Preparing shipment showing payment and picking prerequisites and carrier event controls](https://static-docs.nocobase.com/shipping-prerequisites-b983ba83f6554190.png)

```text
I want to build a process in the current application for shipping. Give me a step table and a diagram first, and write code after I confirm them.

Shipping waits for two things: the payment platform confirming payment and the warehouse finishing picking, which can arrive in either order; once both are done it moves to awaiting handover. After handover to the courier, the courier platform pushes tracking events such as picked up, in transit, out for delivery and delivered; handle them by the time they happened, and ignore a push older than the latest recorded event; on delivery, shipping completes and the customer is notified.
```

## Support ticket

Support works on a customer's problem and waits for the customer's replies along the way.

**What it builds**: the ticket detail page shows the whole conversation in time order; buttons that cannot be used are greyed out with the reason, such as "The reopen period has passed".

**Capabilities used**: alternating human actions and waits, closing automatically on timeout, reopening within a limit, saying why an action is not available.

Under **Workflow → Help desk**, open “发票抬头填错了，能否重开？”. The conversation shows the customer's question, assignment, the agent's reply and the customer's additional information. Use **Signed in as** at the top right to switch demonstration roles and inspect their available actions.

![Support ticket conversation, assignee and currently available actions](https://static-docs.nocobase.com/ticket-conversation-8145cf7198dd2368.png)

```text
I want to build a process in the current application for support tickets. Give me a step table and a diagram first, and write code after I confirm them.

After the customer submits a ticket, it awaits assignment; an agent picks it up from the queue, or a supervisor assigns it. When the agent replies to the customer, it moves to "awaiting customer reply", and returns to in progress when the customer replies. The agent can mark it resolved; if the customer does not reply within 72 hours it closes automatically; within 7 days of closing the customer can reopen it, and after 7 days the button is greyed out with "The reopen period has passed". Only the ticket's assignee can reply and mark it resolved; a supervisor can reassign it, and reassigning requires a reason. When the agent replies, email the customer, retrying automatically on failure. The ticket detail shows the whole conversation in time order.
```

## Work handled by several people

When a step needs several people together — countersigning, any-one-of approval, several people acting separately and then combined, adding approvers — it is easier to build with the [approval plugin](../approval/index.md).
