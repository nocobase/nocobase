---
title: 'Developing with an Agent'
---

# Developing with an Agent

The user decides business facts and policies; the Agent integrates capabilities, pages, and checks. Confirm diagrams first and add one class of rules at a time.

## Describe the business

Specify the record, roles, stages, advancement, inputs, branches, deadlines, and external work. Clarify driver refusal, post-departure exceptions, evidence requirements, and approvals that block later actions.

Only defined actions change stages. Forms, imports, and other APIs must not bypass them. Enforce conditions on the server and explain refusal in the interface.

## Deadlines

```text
Remind the driver after 30 minutes awaiting acceptance. After 60 minutes, notify dispatch and the operations lead.
Do not treat reminders as acceptance or send the same reminder repeatedly.
Flag transport past its expected delivery date for dispatch follow-up.
Base checks on stage entry or order dates and continue after restart.
Record automatic handling and reasons.
```

Deadlines can use elapsed stage time, reminder-then-escalation, or record dates. Background checks are required; browser countdowns alone are insufficient.

## Notifications and external results

```text
Notify the account manager after delivery evidence is committed, with a link to the order.
Delivery failure must not roll back saved transport results.
Validate external tracking sources and order matching, handle duplicate events once, and prevent late events from reopening completed orders.
Specify retry policy, final-failure ownership, and execution history.
```

Reliable work needs execution records, retries, and business-keyed idempotency. Best-effort UI events are different. Clearly label simulated integrations. External results may use callbacks or polling, with a deadline and manual exit if no result arrives.

## Pages and tasks

Provide stage-filtered lists, diagrams, inputs, actions, and history, plus personal tasks. Refresh after processing; conflicts explain that another person already acted rather than overwrite their work.

## Checks and release

Check role and input rules, branches, exits, deadlines, duplicate and late events, retries, and concurrent processing. Review actual evidence. Before release, confirm policy values, background processing, and authorization.

## Change an existing flow

```text
Propose a handover stage before in transit, without changing code or data yet.
Analyze records in each stage, in-flight continuation, old and new action compatibility, and staged deployment.
Do not remove old state names while active records still depend on them.
```

Retain compatibility, migrate existing records, then remove old definitions. Explain how changed rules affect in-flight work.

## Diagnose a stalled order

```text
An order is stuck awaiting acceptance. Inspect assignment, conditions, history, and external work first.
Explain whether it is waiting for a driver, an external result, or failed background processing. Propose handling without changing data.
```

Use protected system operations with history for corrections, not arbitrary status edits.
