---
title: 'Workflow overview'
description: 'Define multi-step processes, wait for people, external results or deadlines, and track execution.'
---

# Workflow overview

**A workflow defines and executes a business process by connecting actions, execution conditions and transition rules.** It controls the sequence of steps, the conditions required to advance, and how to handle waiting, timeouts and execution failures.

For example, assigning a driver, accepting a transport order and confirming delivery each have their own actions and conditions. The workflow advances the order according to these rules and retains its progress and processing history.

## Available capabilities

| Capability                                                 | What it provides                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [Process definition and action control](./definition.md)   | Stages, actions, conditions and branches, required inputs, and protection against skipped steps or conflicting updates. |
| [Waiting, timeouts and reliable execution](./execution.md) | Wait for people or external results, handle deadlines, retry failures and avoid processing the same request twice.      |
| [Progress and processing history](./progress.md)           | Show the current stage, traversed paths, actors, timestamps and submitted information.                                  |

The following pages use Northstar transport orders for action control and history, then background report exports for waiting and execution results.

## When to use a workflow

Use workflows for business with multiple stages, waiting periods or follow-up actions after failures. Order delivery, invoicing, exports, renewals and exception tickets are typical uses.

Use [Notifications](../notification.md) for a message after a data change, and [Scheduled tasks](../scheduler.md) for a task at a fixed time. A workflow connects these actions around one business record and continues until the process ends.

Simple confirmation or rejection can be workflow actions. Use [Approval](../approval/index.md) for multi-level decisions, countersigning, additional approvers and reassignment.

## Build and change a process

Describe stages, conditions, waiting periods and failure handling to the Agent, which develops the process into the application. Process pages can be freely designed to suit business needs.
