---
"@nocobase/app-host": patch
---

Default the extra system memory reserve to zero while retaining cold-start headroom and heap admission checks. Operators can still configure an explicit reserve for other processes.
