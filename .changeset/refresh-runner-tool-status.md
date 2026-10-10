---
"@nocobase/agent-protocol": patch
"@nocobase/agent-runner": patch
"@nocobase/app-plugin-agents": patch
---

Refresh runner tool installation and sign-in status on request and every ten minutes, with persistent heartbeat requests, completion acknowledgement, runtime menu and detail actions, and restart guidance for older runners.

Announce refresh support through an optional field accepted by older receivers, and wait for completed detection and its acknowledged heartbeat before claiming work.
