---
'@nocobase/app-plugin-schedule-example': minor
'@nocobase/app-template-examples': patch
---

Add `@nocobase/app-plugin-schedule-example`, a plugin running a recurring job on the application's jobs service

Its provider takes an executor of its own from `jobExecutorServiceToken`, registers a `heartbeat` job that runs every minute, sets the executor up, removes the rules of jobs it no longer defines, and shuts the executor down with the application. An authenticated `GET /api/schedule-example` returns the job's next firing and its recent runs. The examples template registers it.
