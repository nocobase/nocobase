---
'@nocobase/app-plugin-workflow': minor
---

Run workflow tasks on `@nocobase/jobs` instead of `@nocobase/queue`

**Breaking.** Workflow publishes and consumes its tasks through its own `JobExecutor` from `@nocobase/app-server/jobs`, on the `@nocobase/app-plugin-workflow` scope. It depends on `@nocobase/jobs` as a peer instead of `@nocobase/queue`. The jobs namespace, which defaults to the application name, now keeps applications apart. The `workflow:<appName>` queue name did that before. The engine sets the executor up when it initializes and shuts it down when it is disposed. It no longer keeps a module-level registry of dispatch handlers.

`workflow.jobs` names the `jobs` configuration tasks run on. Left out, they follow `jobs.default`. A name that `jobs` does not define stops the application from starting. The memory adapter serves one process, so an application running more than one instance needs a `redis` jobs configuration.

Upgrading: compose `JobExecutorServiceProvider` in `server/app.ts` and declare `@nocobase/jobs` as a dependency. The application templates already do both. Tasks still waiting in a queue connection are not moved. Runs that were accepted but never started are published again by the recovery that runs when the engine initializes.
