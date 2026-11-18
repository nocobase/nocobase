---
"@nocobase/app-host": patch
"@nocobase/app-plugin-releases": patch
---

Show who shares an App's app host: a section on the App page lists the Apps of every environment running, starting, waiting or failed on it, why each holds a slot or waits (requests, connections, always running, recent use; not enough memory, the active App limit, a pending host restart), the shared process's memory as one total, a pending or running host restart, and environments whose Apps could not be restored. App badges show a refused start as waiting for a free slot, memory or the host restart.
