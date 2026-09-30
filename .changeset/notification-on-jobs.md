---
'@nocobase/app-plugin-notification': minor
---

Run Delivery tasks on `@nocobase/jobs` instead of `@nocobase/queue`

**Breaking.** Notification now submits each Delivery to its own `JobExecutor` from `@nocobase/app-server/jobs`, on the `@nocobase/app-plugin-notification` scope, and depends on `@nocobase/jobs` as a peer instead of `@nocobase/queue`. The plugin sets the executor up when it starts, so Deliveries are consumed on every jobs backend. Before this change, nothing consumed the queue's `default` queue on a `redis` or `database` connection, and Deliveries waited there until the application ran on the `sync` driver. A Delivery in progress now finishes before its Channel's Provider is closed on shutdown.

`notification.jobs` names the `jobs` configuration Deliveries run on. Left out, they follow `jobs.default`. A name that `jobs` does not define stops the application from starting. The memory adapter serves one process, so an application running more than one instance needs a `redis` jobs configuration.

`createNotificationManager` takes `executor: JobExecutor` in place of `queue`, and owns its lifecycle: it registers the Delivery job and sets the executor up on activation, and shuts it down in `close()`. `NotificationRuntime.activate()` now returns a promise.

Upgrading: compose `JobExecutorServiceProvider` in `server/app.ts` and declare `@nocobase/jobs` as a dependency. The application templates already do both. Deliveries still waiting in a queue connection are not moved. The reconciler resubmits every pending Delivery from the database, so none is lost.
