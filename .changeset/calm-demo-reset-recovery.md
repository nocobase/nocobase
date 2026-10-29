---
"@nocobase/app-plugin-demo-mode": patch
---

Reuse demo clock formatters and bound tracking writes and status reads, preserve cleanup failure diagnostics, and retry settled daily reset failures with durable claims while closing unacknowledged attempts once their data settles and requiring manual recovery only for interrupted data operations.
