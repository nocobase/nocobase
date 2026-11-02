---
'@nocobase/agent-runner': patch
---

Retain bounded partial conversation replies after native cancellation or token-limit termination, preserving output redaction and completed-block deduplication.

Drain native cancellation snapshots through the worker before acknowledging cancellation, sharing the existing five-second stop budget across tool stop, results and final events. Recognize the Claude SDK abort exception by its exported type even when its class name is minified.
