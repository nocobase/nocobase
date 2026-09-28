# @nocobase/app-plugin-schedule-example

Schedule service example. The plugin's provider takes an executor of its own from `jobExecutorServiceToken`, under its package name as the scope, and runs a `heartbeat` job every minute.

- `start()` subscribes to the executor's events, registers the job with `addJob`, and then calls `setup()`, which writes the rule and starts executing it. It then removes the rules of jobs its code no longer defines — the scope is this plugin's alone, so every other rule under it is left over from an earlier version.
- `shutdown()` unsubscribes and shuts the executor down, which keeps the rule for the next start.
- `execute` receives the firing's `jobId`, `scheduledAt` and `runAt`, and records the run from them; the events report how each firing ended. Events are delivered after the fact, so the handler never counts on its `ScheduleStart` having been handled.

Send an authenticated `GET` request to `/api/schedule-example` to see the job's next firing and its most recent runs.

On the `memory` jobs adapter, the application's default, the job runs in one process and its state is written under `storage/jobs` when the application stops; set `jobs.default` to `redis` to run it once per firing across several instances. See the `@nocobase/jobs` README for the full contract.
