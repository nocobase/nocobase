---
"@nocobase/app-plugin-demo-mode": patch
---

Reuse demo clock formatters and bound tracking writes and status reads, log cleanup failure diagnostics, and retry settled daily reset failures with durable claims, including retries after local midnight, while closing unacknowledged attempts only when their reset completed and pausing for manual recovery of an interrupted data operation until it has not moved for an hour, when the schedule takes it over.
