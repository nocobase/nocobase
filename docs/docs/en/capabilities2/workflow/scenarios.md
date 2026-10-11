---
title: 'Scenario examples'
---

# Scenario examples

These six adaptable requirements show common workflow patterns. Ask for stage tables and diagrams before implementation; they do not require six separate applications.

## Transport invoicing

```text
Submit invoice details for completed transport orders to a provider. Retry submission three times, then let finance handle final failure.
Wait for results, store the invoice number and file, and notify the customer.
Query after ten minutes without a callback; prevent duplicate issuance and handle duplicate results once.
Provide stages and a diagram first.
```

This combines callbacks, fallback queries, retries, and idempotency. Pages show progress, failures, and downloads.

## Monthly report export

```text
Submit a transport report to an external export service. Poll every 30 seconds, store the completed download, and notify the requester.
Fail after ten minutes, ask the external service to stop, and explain the reason. Provide stages and a diagram first.
```

This uses polling, an overall deadline, and external cancellation.

## Compensate for failed reservations

```text
Reserve a vehicle or capacity before subsequent confirmation. Release it if confirmation fails.
Retry release three times, then require manual handling. Make every external step idempotent and record outcomes.
Provide stages, a diagram, and release handling for every exit.
```

This is the same pattern as reserving inventory before payment in a flash sale. Compensation needs its own failure exit.

## Delivery agreement renewal

```text
Renew delivery agreements periodically. Successful payment advances the period; failure enters payment due and retries daily.
After three failures, stop service under the agreed policy and notify the customer. Updated payment details allow immediate retry.
Cancellation takes effect at period end. Provide stages, a diagram, and missing financial or suspension decisions first.
```

This uses record dates, repeated attempts, and explicit cancellation timing.

## Multiple conditions and out-of-order events

```text
Require warehouse readiness and fee confirmation before handover, in either arrival order.
Process carrier events by occurrence time; ignore older events, authenticate sources, and apply duplicates once.
Provide stages and a diagram first.
```

Combining signals does not imply a general parallel-branch designer.

## Transport exception tickets

```text
Queue customer exceptions for assignment or claiming. Replies wait for customer input, which resumes handling.
Close after 72 hours without a reply; allow reopening within seven days and explain later refusal.
Require reassignment reasons, preserve conversation, and retry reply emails. Provide stages and a diagram first.
```

This combines human work, waiting, deadlines, reopening, and repeated exchanges. Coordinated decisions use [Approval](../approval/index.md).
