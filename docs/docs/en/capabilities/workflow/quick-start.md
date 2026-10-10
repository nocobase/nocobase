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
In the current application, use NocoBase's process capability (@nocobase/lifecycle) to build a process for order payment. First check whether the application already has this capability, and add what is missing.

After the customer places an order, it is awaiting payment. When the customer pays, the payment platform's checkout opens; only the payment platform's notification can mark the order as paid, and the notification must have its signature verified; the same notification delivered more than once counts once. An order unpaid for 30 minutes expires automatically; while awaiting payment, the customer can cancel the order. A payment received after the order expired or was cancelled is refunded automatically. Notify the customer when payment succeeds.

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

## Step 5: Accept

Passing on the page is not enough; some cases are hard to cover by hand. Ask the Agent to prove every case with tests and to give you the build result:

```text
Add tests and give me the results: only the payment platform's notification can mark an order as paid; a duplicate notification counts once; an order unpaid for 30 minutes expires (advance time in the test); a payment received after cancellation or expiry is refunded; after 3 failed refunds the order stays at refund failed. Finally run lint, typecheck, test and build.
```

When every test passes and the build succeeds, your first process is done.

## Next

- [Develop with an Agent](./develop.md): add shipping, delivery and more rules to this order, and learn every step of developing a complete process
