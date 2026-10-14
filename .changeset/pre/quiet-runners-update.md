---
'@nocobase/agent-protocol': minor
'@nocobase/agent-runner': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/studio': patch
---

Interrupt agent runs for runner updates after stopping tools and preserving local continuation references. Requeue upgrade interruptions without consuming failure attempts or notifying project managers, retain task inputs, and report draining capacity and reasons in runner and queue views.
