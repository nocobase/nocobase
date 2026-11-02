---
'@nocobase/agent-protocol': patch
'@nocobase/agent-runner': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/acp-bridge': patch
'@nocobase/app-cli-client': patch
'@nocobase/app-plugin-agent-sessions': patch
---

Recover runners and agent-session bridges after a protocol upgrade. Heartbeat answers now carry the server's runner protocol (`protocolVersion`), and a runner that speaks an older protocol while no newer version is offered logs what it speaks, what the application needs and how to update, instead of looking up to date. A bridge refused for its protocol now receives the protocols the application speaks in the error's `metadata`; `acp start` then updates the CLI as `update` does and exits non-zero so its launchd, systemd or Startup service starts it again on the new version, and when no update helps it still exits non-zero after a pause rather than stopping with success. A computer whose bridge was refused as too old is shown on My agents with the commands to update it.
