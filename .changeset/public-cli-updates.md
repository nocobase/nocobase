---
"@nocobase/app-cli-client": patch
"@nocobase/app-cli": patch
---

Allow applications that explicitly opt into public CLI distribution to check and install updates with `update --server <application-url>` without a session. Keep authenticated updates and protected products unchanged, and never forward profile credentials to an explicit public target.
