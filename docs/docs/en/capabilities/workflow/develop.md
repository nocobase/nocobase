---
title: 'Develop with an Agent'
description: 'From describing the process and confirming its diagram to pages, acceptance and changes after release: the whole path in one page.'
---

# Develop with an Agent

The Agent writes the process into the application's source. You do not need to learn any API. Your part is three things: explain the business clearly, confirm the diagram before code is written, and accept the evidence the Agent gives you.

This page follows an order through development in order. The order waits for the customer to pay, for the payment platform's notification, for the warehouse to ship and for the courier to deliver, with an automatic cancellation on timeout and a refund on failure along the way — the most common kinds of waiting in a process. Every step comes with a prompt you can adapt; more business scenarios are in [Scenarios](./scenarios.md).

## Before you start

Decide which record the process belongs to: an existing business table, or a new one. For an existing table, see [adopting an existing table](./extension.md#adopting-an-existing-table) in Extension.

You do not need to install anything yourself. Mention "NocoBase's process capability (`@nocobase/lifecycle`)" in the prompt, and the Agent checks whether the application has it and adds it if not.

The recommended rhythm is: **diagram first, code second; one kind of rule at a time.** Build the steps and actions first, then timeouts, then notifications and external systems, and accept each kind before adding the next. With every rule added at once, a problem is hard to trace to the rule that caused it.

The division of work:

| You                                      | The Agent                                                            |
| ---------------------------------------- | -------------------------------------------------------------------- |
| Business facts: steps, roles, rules      | Checks the existing application; builds the process, pages and tests |
| Key decisions: the questions it raises   | States the assumptions it made                                       |
| Acceptance: review the tests and results | Writes the test cases and gives test and build results               |

## Step 1: Explain the process

Tell the Agent the following; leave out what you have not decided, and the Agent will list what is missing and ask you:

| To explain     | Example                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Record         | An order, with customer, line items, amount and shipping address                                                        |
| Roles          | Who starts it, who handles it, who can only view it                                                                     |
| Steps          | Which steps it passes from start to end, and which ones are ends                                                        |
| How it moves   | What moves each step: a person's action, an external notification or query result, time passing; and where it goes next |
| Required input | What must be entered, such as a reason, a number or an attachment                                                       |
| Branches       | How amount, type or region decides the next step                                                                        |
| Timeouts       | How long to wait, and whether a timeout reminds, reassigns, closes or cancels                                           |
| External work  | Who is notified when done, and whether to call payment, logistics, ERP or other systems                                 |

Describe only the business. Do not prescribe field names, API paths or implementation; leave those to the Agent, which knows the application. Finally ask it for a step table, a diagram and the business decisions still missing:

```text
Use NocoBase's process capability (@nocobase/lifecycle) to build a process for orders. Do not write code yet.

Record: an order, with customer, line items, amount and shipping address.
Roles: customer, support, warehouse.
Steps: awaiting payment → awaiting shipment → shipped → delivered → completed; it can be cancelled while awaiting payment or awaiting shipment.
Rules: payment is confirmed by the payment platform's notification; the warehouse must enter the courier and tracking number when shipping; delivery is confirmed by the courier platform's notification.
Timeouts: cancel automatically if unpaid for 30 minutes; complete automatically 7 days after delivery.
External work: notify the warehouse when payment succeeds; text the customer the tracking number after shipping; refund automatically when a paid order is cancelled.

Give me: 1) a step table (step, what moves it forward, which person or system does so, what is entered or recorded, which step comes next, what happens afterwards); 2) a diagram; 3) the business decisions you think are still missing, listed one by one as questions for me.
```

## Step 2: Confirm the diagram

Check the diagram for:

- Every step that is not an end has a way out and cannot get stuck. For a step that waits for an external system, ask: what if it never answers?
- Sending back, withdrawing, resubmitting, reopening and cancelling are not missing.
- Every action states who may take it.
- A step changes only through an action. Neither a form edit nor a data import can set an order to "shipped" directly.

Answer the Agent's questions until the step table has no open points. Settle the names of steps and actions now: renaming one after release takes several deployments (see [Changing a process in production](#changing-a-process-in-production)).

```text
Additional decisions: a shipped order cannot be cancelled; the customer can only request a return, and returns are out of scope for now. Support can change the shipping address while awaiting shipment, and the change is recorded in the history. A customer can cancel only their own orders; support can cancel any order not yet shipped. Update the step table and the diagram.
```

## Step 3: Add the rules for each action

Once the diagram is settled, add the details of each action:

- **Who may act**: others see the button greyed out with the reason; calling the API directly is refused with the same reason.
- **Required input**: when something is wrong, say which field.
- **Conditional branches**: one action can lead to different steps depending on conditions, such as an extra confirmation before shipping a large order.
- **Values kept with the step**: the current handler, a deadline, a computed result, saved together with the step.
- **Who can see the record**: when permissions are involved, say so too; see [Authorization](../authorization/index.md).

```text
Only warehouse staff can ship; others see the button greyed out with "Only warehouse staff can ship". Shipping requires the courier and tracking number, and an invalid tracking number is pointed out. Cancelling an order requires choosing a reason. An order over 5,000 goes to "awaiting support confirmation" after payment, and to awaiting shipment only after support confirms it.
```

## Step 4: Timeouts and automatic handling

When a record waits too long in a step, it can be reminded, reassigned, closed or cancelled automatically. Common forms:

- One stage: act directly on timeout, such as cancelling an order unpaid for 30 minutes.
- Two stages: remind first, then escalate, such as reminding the handler at 24 hours and reassigning to a supervisor at 48.
- By a date on the record: a contract's end date, the end of a subscription period.

A timeout is not a timer per record but a regular check for records that have waited too long, so restarting the application does not lose it. Automatic actions also appear in the history, with "System" as the actor.

```text
Cancel an order automatically if unpaid for 30 minutes; remind the warehouse manager when an order has been awaiting shipment for more than 48 hours; complete an order automatically 7 days after delivery. Automatic actions write their reason in the history.
```

## Step 5: Notifications and external systems

Sending notifications and calling external systems happen only after the action has succeeded, so their failure never makes the action fail. What to explain:

- **On failure**: how many automatic retries; which step it moves to if it still fails, and who retries it by hand.
- **Where final failures are handled**: if needed, ask the Agent for an admin page listing failed work, with retry and cancel.
- **How the result comes back**: returned directly; a later callback (such as a payment platform); or no callback, so it has to be polled.
- **Unexpected notifications**: what a duplicate, an early one, or one arriving after the record was cancelled each leads to.
- **No duplicate execution**: however many times something is retried, the external system does it once.

Notification channels use the application's [notification](../notification.md) capability. Polling external progress and undoing work after a failure are covered in [Scenarios](./scenarios.md).

```text
Payment: when the customer pays, open the payment platform's checkout; only the payment platform's notification can mark the order as paid; the notification has its signature verified, and the same notification delivered more than once counts once; money received after the order was cancelled is refunded automatically.
Refund: when a paid order is cancelled, call the refund API; retry 3 times on failure, and if it still fails move to "refund failed", where support can retry by hand; one order is refunded only once however many retries it takes.
```

## Step 6: Pages

A process usually needs these pages:

- **List page**: filter by step, show the current handler.
- **Detail page**: the diagram, the actions available now (with the reason for those that are not), the form filled in when acting, and the history.
- **Workbench or to-do list**: the records the current user has to handle, updated when someone else acts.

When two people act on the same record at once, the later one sees "This record has been handled by someone else; please refresh" and does not overwrite the first result.

```text
Build an order list page, a detail page and a warehouse "awaiting shipment" workbench. The list page filters by step. The detail page shows the diagram at the top, marking the current step; in the middle, the actions the current user can take, with unavailable ones greyed out and their reason; at the bottom, the history with who acted, when and what they entered. The "awaiting shipment" workbench lists every order awaiting shipment, and an order disappears once someone else ships it.
```

## Step 7: Accept

Acceptance is done by the Agent through test cases, not by clicking through pages by hand. Tests are what keep the process stable: run them again after every change, and you know the existing rules still hold. Do not settle for "it's done"; look at the test cases and their results.

The tests should cover:

| Area             | What to prove                                                                      |
| ---------------- | ---------------------------------------------------------------------------------- |
| Who may act      | Each action has at least one allowed and one refused case, with the reason checked |
| Branches         | Every branch is taken at least once                                                |
| Timeouts         | Automatic handling on timeout, advancing time in the test rather than waiting      |
| External systems | Duplicate and late notifications, failures, retries and manual retries             |
| Concurrency      | A repeated submission counts once; an action from a stale page is refused          |
| Full paths       | At least one complete path from creation to each end step                          |

```text
Add test cases for the order process and give me the list of cases and the run results: each action has at least one allowed and one refused case, with the reason checked; one case per branch; advance time to verify that an order unpaid for 30 minutes is cancelled and that an order completes 7 days after delivery; the same payment notification delivered twice counts once; money received after cancellation is refunded; after 3 failed refunds the order is at refund failed, and a manual retry succeeds; of two concurrent actions only one takes effect; one complete path each from placement to completed and to cancelled. Finally run lint, typecheck, test and build.
```

Check what the Agent gives you:

- The list of cases maps one to one to the rules you gave; if any is missing, have it added.
- Every test passes and the build succeeds. When a test fails, have the Agent fix the process, not change the test to fit the result.
- From then on, whenever a kind of rule is added or the process changes, have the Agent add the matching cases and run the whole suite again.

Before release, confirm three more things: the values of timeouts and amount thresholds; that the timeout check is enabled; the permissions of pages and APIs.

## Changing a process in production

A process lives in the application's code. After release, its steps, actions and rules cannot be changed in the interface, and neither can values such as timeouts and amount thresholds. Change it as you developed it — locally — and redeploy:

1. In the local development environment, tell the Agent what to change.
2. Have the Agent first explain the effect on records already in the process in production, and implement it after you agree.
3. Add tests: besides the new process itself, prove that records already in the process can carry on.
4. Build and redeploy the application; see [Deployment](../../deployment/index.md).
5. After deploying, spot-check a few records in the process to confirm they carry on as expected.

Different changes affect records already in the process differently:

| Change                                  | Effect                                                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Add a step, an action or a notification | Records already in the process follow the new process from their next step                                                 |
| Change a rule, a timeout or a threshold | Affects only later actions; a waiting record is judged by the new rule the next time it is acted on or checked for timeout |
| Rename or remove a step                 | Records still in that step get stuck; it takes several deployments (see below)                                             |
| Remove or rename external work          | Remove it only once everything still queued for it has run                                                                 |

To rename or remove a step, deploy three times: first add the new step and a move action only the system can take; after deploying, use it to move the records to the new step, leaving entries in the history; once the old step has no records left, remove it.

With several servers, old and new versions briefly run side by side, and an old version may refuse an action on a newly added step until the deployment finishes.

To correct wrong data, likewise write an action only the system can take, run it after deploying with the application, and leave entries in the history. Do not edit the database directly.

```text
I want to add a "picked" step between awaiting shipment and shipped, and there are orders awaiting shipment in production. First explain: can this be deployed in one go, how does it affect those orders, and how will they carry on after deploying? Implement it once I agree, and add tests proving that orders already awaiting shipment can still be shipped under the new process.
```

## Troubleshooting after release

When a record sits in a step without moving, or external work has no result for a long time, have the Agent find the cause before doing anything. It compares the record's history with the execution records of the external work and tells you where it is stuck. Ask for the conclusion and a recommendation first, and act once you agree; correct data through an action only the system can take.

```text
An order has been "cancelled" for more than a day and the customer has not been refunded. Check its history and the execution records of the refund, and tell me where it is stuck, why, and what you recommend. Do not change any data yet.
```
