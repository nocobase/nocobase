---
title: 'Quick start'
description: 'Using order payment as the example, ask an Agent to develop a first process in your own application: describe it, confirm the diagram, implement, walk through and accept.'
---

# Quick start

This page walks you through building your first process in your own application: order payment. After a customer places an order, it counts as paid only once the payment platform says so; an order unpaid for 30 minutes expires; money that arrives after the order was cancelled is refunded. There are five steps, each with a prompt you can use as it is.

## Before you start

You need a NocoBase application in which you can develop with an Agent; if you do not have one yet, see [Create an application](../../get-started/create-app.md).

You do not need an orders table in advance, nor a real payment platform account. The Agent checks what the application already has and adds what is missing, and a simulated service stands in for the payment platform.

## Step 1: Describe the process

Explain three things in business terms: which steps an order passes through from placement to the end; what moves each step forward (a customer action, a payment platform notification, time passing); and what happens when something goes wrong. Do not let the Agent write code yet — ask only for a step table and a diagram.

```text
I want to manage order payments in the current application, with the following requirements.

After the customer places an order, it is awaiting payment. When the customer pays, the payment platform's checkout opens; only a notification confirmed to come from the payment platform can mark the order as paid; a forged notification must not change the order status; the same notification delivered more than once counts once. An order unpaid for 30 minutes expires automatically; while awaiting payment, the customer can cancel the order. A payment received after the order expired or was cancelled is refunded automatically. Notify the customer when payment succeeds.

Do not write code yet. Give me a step table (step, what moves it forward, which person or system does so, what is recorded, which step comes next, what happens afterwards), a diagram, and the business decisions you think are still missing.
```

## Step 2: Confirm the step table and diagram

Check three things:

- The steps awaiting payment, paid, cancelled and expired are all there, and every step that is not an end has a way out.
- Only the payment platform's notification can make an order paid; neither the customer nor support staff can change it by hand.
- A payment notification that arrives after cancellation or expiry leads to a refund, not to the order being changed back to paid.

Then answer the Agent's questions until nothing is open. Changing the process here is cheapest; once code is written, a change means testing again.

```text
Additional decisions: a paid order cannot be cancelled for now; a failed refund is retried automatically 3 times, and if it still fails it stops and the order is marked "refund failed". Update the step table and the diagram.
```

## Step 3: Let the Agent implement it

Ask the Agent to build the pages together with a simulated payment platform you can operate by hand, so you can check every case yourself in the next step. Ask it to tell you where to look and how to walk through it when it is done.

```text
The step table is fine; start implementing. Use a simulated service for the payment platform, with a panel on the page where I can pay by hand, hold a notification, release a notification and resend a notification. The order detail page shows the diagram (marking the current step and the steps passed), the actions available now and the history. When you are done, tell me which page shows the orders and how to walk through the whole process.
```

## Step 4: Walk through it on the page

Walk through each of these four cases:

| Case                   | What to do                                                  | What you should see                                                    |
| ---------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Normal payment         | Place → pay → release the notification                      | The order becomes paid; the history says the payment platform moved it |
| Cancelled, then paid   | Hold the notification while paying, cancel, then release it | The order stays cancelled and the money is refunded                    |
| Duplicate notification | Send the same notification again                            | It is reported as already processed; nothing is credited twice         |
| No payment             | Place an order and do not pay until the time is up          | The order expires; the actor in the history is "System"                |

You do not need to wait 30 minutes for the last case: ask the Agent to shorten the time temporarily, and change it back afterwards.

### Walk through the example pages

These screenshots come from **Workflow → Order payment** in the example application. A sandbox simulates the payment platform, and the unpaid order timeout is shortened to 3 minutes; the prompt on this page specifies 30 minutes. The example also includes shipping, refunds initiated by a user and refund result states. The pages and steps the Agent builds from this prompt may differ.

**Open checkout**: select an order and click **Pay** on the order. It moves to awaiting payment, enabling **Pay** in **Payment provider (sandbox)**. This sandbox action simulates payment on the provider's platform; the order waits for the webhook before becoming paid.

![Order awaiting payment with the sandbox payment controls](https://static-docs.nocobase.com/order-awaiting-payment-00bb6335875c9bf1.png)

**Normal payment**: click **Pay** in the sandbox without selecting **Hold the webhook**. Once the notification arrives, the order shows Paid and stores the payment reference; the webhook result shows Applied.

![Payment notification applied and the order marked paid with its payment reference](https://static-docs.nocobase.com/order-paid-b6b1944c9e482001.png)

**Duplicate notification**: click **Deliver again** for the same notification. Its result becomes Replayed, the order stays paid, and payment is not credited twice.

![Duplicate payment notification reported as replayed without changing the order](https://static-docs.nocobase.com/order-replayed-43f5d67da8ae48a6.png)

**Cancelled, then paid**: select another unpaid order, click **Pay** on the order, select **Hold the webhook**, then click **Pay** in the sandbox. The provider has received the money, but the notification has not arrived, so the order still awaits payment.

![Payment completed at the provider while the held webhook leaves the order awaiting payment](https://static-docs.nocobase.com/order-held-e016bd6dea47a3df.png)

Next, cancel the order and click **Deliver** for the notification. The example passes through Refunding to Refunded and shows the refund reference; it never returns to Paid. The table above specifies keeping the order cancelled while refunding. Settle this choice of states in Step 2 and accept the implementation against the step table you confirmed.

![Late payment after cancellation automatically refunded with its refund reference](https://static-docs.nocobase.com/order-refunded-014dfd556b48f8b1.png)

## Step 5: Accept

Passing on the page is not enough; some cases are hard to cover by hand. Ask the Agent to prove every case with tests and to give you the build result:

```text
Add tests and give me the results: only the payment platform's notification can mark an order as paid; a duplicate notification counts once; an order unpaid for 30 minutes expires (advance time in the test); a payment received after cancellation or expiry is refunded; after 3 failed refunds the order stays at refund failed. Finally complete the application’s quality checks and build, and give me the results.
```

When every test passes and the build succeeds, your first process is done.

## Next

- [Develop with an Agent](./develop.md): add shipping, delivery and more rules to this order, and learn every step of developing a complete process
