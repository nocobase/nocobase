---
"@nocobase/agent-runner": patch
---

Use the same cancellation evidence and recovery acknowledgement rules for live worker exits and daemon restarts. Preserve unconfirmed structured cancellation reports instead of downgrading them to ordinary failure reports when the daemon has not observed cancellation yet.
