---
'@nocobase/app-host': patch
---

Let `AppHostSupervisor` restrict what the Host child inherits: `env.allow` passes only the listed variables (plus `PATH`, `HOME`, `TMPDIR`, locale and Node settings) instead of the whole environment, `uid`/`gid` run it as another user, and `launchPrefix` starts it through a wrapper such as `setpriv` or `sandbox-exec`. A child that cannot be started now fails the start with a clear error instead of ending the supervising process.
