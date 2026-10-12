---
"@nocobase/app-cli": patch
---

Keep development restart input open when a background or Agent-run process receives stdin EOF, so configuration and dependency changes can still restart the server. Preserve the supervisor worker input across background starts and dotenv restarts.
