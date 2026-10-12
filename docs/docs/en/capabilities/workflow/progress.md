---
title: 'Progress and processing history'
---

# Progress and processing history

Workflows provide current stages, traversed paths and processing history. Users can see where a record is, what it is waiting for, and who performed each action, when and with what information.

An application can display this information as a process diagram, stage bar or history list within business details. A process diagram presents execution progress; it is not a drag-and-drop process designer.

## Example: inspect order delivery history

Retain progress and each action on Northstar order pages so employees can check delivery evidence and understand how the order reached its current stage.

```text
Show the current workflow stage and processing history in Northstar order details.
Record the actor, timestamp, action, previous and next stages, and rejection reason or delivery evidence.
Mark automatic actions as performed by the system.
Keep progress and history after refresh so the delivery process can be reviewed after completion.
```

## View the result

After acceptance and departure, delivery evidence and final confirmation, order **NS-2026-003** is **Completed**. **Processing history** shows the three actual actions, stage changes, timestamps and submitted information.

![Completed order showing its current stage and three actual processing records](../assets/northstar-process-completed-en.png)

**The order is complete, and its actions, stage changes and delivery evidence remain available for review.**

This transport example uses a stage bar and history list. The [background export example](./execution.md#view-execution-results) also shows automatic system actions and their output. Page layouts can be freely designed for business needs.

:::tip Important notes

For a stalled process, inspect its current stage, required conditions and latest history first. For external calls, also check success and retry status. Before changing a running process, plan how unfinished records continue and preserve submitted results and history.

:::

See the [Developer reference](./extension.md) when reviewing implementation APIs.

## Pages and business acceptance

Lists filter by stage; details show progress, available actions, refusal reasons, submitted information and history. Each role's work queue contains its own tasks and updates when others act. Design pages for the business without requiring a separate workflow management interface.

```text
Northstar's dispatch workbench shows orders awaiting assignment or acceptance. Drivers see only their own orders awaiting acceptance or in transit. Details show the current stage, actions and refusal reasons, plus actors, times, stage changes and information in history. Update progress when others act without overwriting their results.
Before release, give me verification results for delivery, refusal and redispatch, cancellation, deadlines, external failures and duplicate notifications. Unrelated people cannot view or act. Explain remaining problems and the production deadlines, recipients and permissions I need to confirm.
```

## Production changes and troubleshooting

Rules live in the application and require redeployment after changes. Identify unfinished orders and pending external work first, explaining the impact of new rules. Arrange a path for existing records before renaming or removing a stage. Authorized corrections preserve history.

```text
Add an "awaiting departure" stage between awaiting acceptance and in transit for Northstar, which has unfinished orders in production. Explain whether one deployment is enough, how existing orders continue and how pending work and history are preserved. Implement after confirmation and give me verification results.
If an order remains in a stage for over a day, investigate its conditions, latest actions and external execution results. Give me the cause and recommendation without changing data yet. I will provide the order number, my identity, action, expected result and actual page error.
```

Confirm production deadlines, people, permissions, notifications and external accounts before release. Spot-check that unfinished records can continue after deployment.
