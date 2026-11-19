---
"@nocobase/app-host": patch
---

Use OS-assigned ports for managed Hosts and discover their actual listeners through session-bound IPC readiness. Preserve strict explicit ports, reject bind failures without trusting unrelated HTTP listeners, and expose the current ready management client without starting a Host.
