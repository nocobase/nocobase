---
'@nocobase/app-host': minor
'@nocobase/app-server': minor
'@nocobase/app-template-default': patch
---

Add standalone and Hub-managed host modes, startup-only YAML or JSON host configuration, FS and S3 release deployment through NocoBase Drive, strict desired deployment reconciliation, file configuration path selection, host-owned structured logging, shared ws-backed App WebSocket handling, private authenticated child-process management over Node IPC, and bounded managed-host crash recovery. Managed deployments use checksum-addressed immutable revision directories, stop-first Runtime replacement with bounded graceful request draining, and a three-revision local cache for fast rollback. Rename the Host's in-process runtime implementation to `InProcessAppHandle`.
