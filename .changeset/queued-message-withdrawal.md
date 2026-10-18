---
'@nocobase/acp-bridge': minor
'@nocobase/app-plugin-agent-sessions': minor
'@nocobase/app-cli-client': patch
---

Allow owners to withdraw individual queued agent messages through server execution claims and computer removal acknowledgements. Bridge protocol 4 requires upgrading and restarting the computer connection; messages already delivered to older bridges cannot be safely withdrawn. Each new message carries its complete instructions and work context. Offline withdrawals remain pending until confirmed, and editing a withdrawn message preserves images and the current draft.
