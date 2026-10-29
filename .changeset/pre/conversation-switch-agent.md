---
'@nocobase/app-plugin-agents': patch
---

Let an owner change the agent of an idle Runner conversation while retaining its history and links; the next message starts a fresh tool session. Refuse changes while any queued, running or finalizing work remains.
