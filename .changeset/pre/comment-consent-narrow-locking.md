---
'@nocobase/app-plugin-agents': patch
---

Claim polls no longer lock or write anything for queued runs they cannot take: comment consent, identity and the agent's concurrency limit are decided from reads, and a transaction opens only for the run about to be claimed. Consent decisions use guarded updates on the request and on each run instead of locking the whole comment run chain, which had exhausted the database pool when several runners polled at once.
