---
'@nocobase/caching': minor
'@nocobase/jobs': minor
'@nocobase/queue': minor
'@nocobase/app-server': minor
'@nocobase/app-plugin-concurrency': minor
'@nocobase/app-plugin-file': minor
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
---

Add the read-only Cluster and distributed settings page and `GET /api/distributed/status`, which show the backend each shared service selected on the answering instance, whether it is shared between instances, and what must change before running several instances, with server and client extension points. Caching, concurrency, Jobs, Queue and Realtime gain a read-only `describe()` and let an adapter declare `sharing: 'local' | 'shared'` when it registers. The file plugin reports the file collections stored on a local disk. Both application templates register the plugin.
