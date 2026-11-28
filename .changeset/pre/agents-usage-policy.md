---
'@nocobase/app-plugin-agents': minor
---

An application may bind `usagePolicyToken` to decide who sees every run in the usage reports (`GET /api/agents/usage` and `/usage/models`); everyone it refuses sees the runs they started or own. Unbound, a reader of usage (`agents.prices` read) still sees every run.
