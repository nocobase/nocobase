---
title: 'Overview'
description: 'Manage orders, tickets, invoicing and other work that passes through several steps and waits for people or external systems: where processes fit and what a finished one looks like.'
---

# Overview

Much business work does not finish in one step. An order waits for the customer to pay, for the warehouse to ship and for the courier to deliver; an invoice waits for the invoicing platform to return a result; a ticket waits for the customer to reply. This work lasts from minutes to months and keeps stopping to wait for people, for external systems or for time to pass. Who or what moves each step forward, what happens on a timeout or a failure, and who is notified when it is done — that is a process.

In NocoBase you describe the process to an Agent in business terms, and the Agent builds it into your application. If the application restarts while a process is waiting, no record loses its progress.

## The process of an order

Take an order as the example:

1. After the customer places it, the order is "awaiting payment". Payment is confirmed only by the payment platform's notification; neither the customer nor support staff can mark it paid by hand.
2. If it is not paid within 30 minutes, the order is cancelled automatically.
3. Once paid, the warehouse is notified; shipping requires a tracking number.
4. When the courier's delivery notification arrives, the order becomes "delivered", and it completes automatically 7 days later.
5. A paid order that is cancelled is refunded automatically; a failed refund is retried, and the money is refunded only once however many retries it takes.

Some easily overlooked cases also have a definite outcome: the same notification from the payment platform delivered twice counts once; a payment notification that arrives after the order was cancelled leads to a refund, not to the order being changed back to paid.

## What users see once it is built

- **A diagram**: every record shows its process diagram, marking the current step and the steps it has passed.
- **Only actions you can take**: an action not available right now is greyed out with the reason, such as "Only warehouse staff can ship". Calling the API directly is refused with the same reason.
- **A history**: who did each step, when, and what they entered. Actions taken automatically show "System" as the actor.
- **Timeouts handled automatically**: reminders, reassignment or closing when something waits too long.
- **Reliable external work**: the right people are notified when a step is done; a failed call to an external system is retried, and the same thing is never done twice.
- **No overwriting**: when two people handle the same record at once, only the first submission takes effect and the second is asked to refresh.

## Work that fits a process

| Kind             | Examples                                                                            |
| ---------------- | ----------------------------------------------------------------------------------- |
| Transactions     | Order payment, shipping, refunds, flash sales                                       |
| External systems | Invoicing, e-signatures, logistics, data export: waiting for a callback, or polling |
| Recurring work   | Subscription renewal, contract renewal                                              |
| Service          | Support tickets, complaints, after-sales, equipment repair                          |
| Approval         | Simple submit, approve and reject                                                   |

Simple approvals can be built directly as a process. Multi-level approval, countersigning, any-one-of approval, adding approvers, delegation, carbon copies, and steps handled jointly by several people are easier to build with the [approval plugin](../approval.md).

You do not need a process when a data change only sends a notification, or when something finishes in a single action with no steps in between.

## Changing a process

A process lives in the application's code. It cannot be edited in the interface, and there is no drag-and-drop designer. To change it — including a timeout or an amount threshold — ask the Agent to change and test it locally, then redeploy the application. Every change is therefore tested and reviewed, and its effect on records already in the process can be stated.

## Next

- [Quick start](./quick-start.md): build your first process, order payment, with an Agent in your own application
- [Develop with an Agent](./develop.md): from describing the process to release and troubleshooting, in one page
- [Scenarios](./scenarios.md): ready-made prompts for invoicing, export, subscriptions, tickets and more
