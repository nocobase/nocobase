---
"@nocobase/app-plugin-demo-mode": patch
---

Expire matching legacy unpartitioned authentication cookies when Demo Mode issues partitioned sign-in cookies, preserving custom cookie names and scopes and cross-site iframe sessions. Verify the new session before reloading the demo home page so rejected cookies cannot cause an automatic sign-in reload loop.
