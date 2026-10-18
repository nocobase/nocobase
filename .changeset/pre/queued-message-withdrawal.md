---
'@nocobase/acp-bridge': minor
'@nocobase/app-plugin-agent-sessions': minor
'@nocobase/app-cli-client': patch
---

Allow owners to withdraw individual queued agent messages through server execution claims and computer removal acknowledgements. Bridge protocol 4 requires upgrading and restarting the computer connection; messages already delivered to older bridges cannot be safely withdrawn. Each new message carries its complete instructions and work context. Offline withdrawals remain pending until confirmed, and editing a withdrawn message preserves images and the current draft.

Unsequenced pre-upgrade commands still on the server cannot be authorized by the new bridge and display a warning asking the owner to send a new message. They are never silently executed without a claim.

Avoid returning unused command payloads during enqueueing so large prompts also work on Oracle.

Confirm each turn’s reports before claiming its successor so errors, usage and completion details keep their transcript boundary. Settle cancelled pending claims even when an approval response is delayed or lost, preventing archived sessions from remaining active or replaying closed messages.
