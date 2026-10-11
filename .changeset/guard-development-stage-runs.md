---
"@nocobase/studio": patch
"@nocobase/app-plugin-agents": minor
"@nocobase/agent-protocol": minor
"@nocobase/agent-runner": patch
---

Check a subject’s admission policy in the claim transaction and cancel outdated issue runs without failing or retrying them. Studio permits its executor only in execution statuses and workflow agents only in their current stage, independently of trigger or mixed comments. Keep eligible executor selection when approving proposals. Requeue live workspace contention without consuming execution attempts, bounded by a six-hour wait, with a compatible failure fallback for older applications.
