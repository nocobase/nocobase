---
'@nocobase/app-server': minor
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-template-hub': minor
---

A standalone application keeps its data under `APP_STORAGE_DIR` when it is set, absolute or relative to the deployment root, instead of `storage/` in the deployment root. Set it when the deployment root is replaced on every release, as an installer that keeps one directory per release does. Explicit storage paths still take precedence, and embedded applications keep the volume their host provides. The Hub template's own `HUB_STORAGE_DIR` is gone in favour of it: a Hub deployment that sets only `HUB_STORAGE_DIR` must rename it to `APP_STORAGE_DIR` before upgrading, or the Hub starts on an empty storage directory.
