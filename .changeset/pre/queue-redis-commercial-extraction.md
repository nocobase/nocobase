---
'@nocobase/queue': major
'@nocobase/app-server': patch
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-plugin-queue-example': patch
---

Move the Redis/BullMQ Queue backend to the Server-only commercial `@nocobase/app-plugin-queue-redis` plugin. Applications using Redis Queue must install and explicitly register that plugin and retain the same Redis target, namespace and logical queue names. Memory remains built in and both templates now declare only Memory. Common configuration is always validated; an unselected Redis declaration no longer requires its implementation, but selecting Redis without it fails explicitly without falling back to Memory. Backend implementations register through the new public runtime contract before host setup. Remove `QueueService.registerBackend()` and OSS Redis identity exports; migrate factories and identity imports to the commercial plugin. Jobs and recurring schedules are unchanged. Coordinate release order: publish the additive OSS API, then the compatible commercial plugin, before shipping this removal. Rollback requires a compatible OSS/plugin/application composition set, not uninstalling the plugin alone.
