---
'@nocobase/app-server': minor
'@nocobase/app-skills': patch
---

Allow plugins to contribute an application-local synchronous ID implementation with asynchronous initialization while retaining the host ID provider and public service token. Select and cache the implementation on first generation, preserving early-resolved references without per-ID container lookups. Document initialization ordering and plugin-owned cleanup.
