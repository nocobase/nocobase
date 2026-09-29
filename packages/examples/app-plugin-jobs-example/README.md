# @nocobase/app-plugin-jobs-example

Jobs service example. The plugin takes two executors of its own from `jobExecutorServiceToken`, both under its package name as the scope: a `ScheduleExecutor` for recurring rules and a `JobExecutor` for one-off tasks. The two share the scope but never a queue or a state file. Each has a page under the "Jobs example" menu group: "One-off jobs" at `/jobs-example/jobs` and "Schedules" at `/jobs-example/schedules`.

## Recurring schedule

`server/schedule/provider.ts` owns the `ScheduleExecutor`, and `client/pages/schedules.tsx` is its page.

- The rules are four fixed slots in `SCHEDULE_SLOTS`: the built-in `heartbeat` every minute, `interval` every 5, 10 or 30 seconds, `limited` every 3 seconds for five runs, and `cron` at the start of every minute. The page starts and stops every slot but the heartbeat, and switches the interval of `interval`.
- The slots are fixed in code on purpose. `start()` registers the handler of every slot before `setup()` — the heartbeat with its rule, the others with `addJob(job, true)`, which registers a handler and writes nothing — because `setup()` starts executing and a rule a user started before a restart is still in the backend. A slot the page started keeps running across restarts with its handler already in place. Letting users create arbitrary rules would need their definitions in a store of the plugin's own, read before `setup()`, which is what `@nocobase/app-plugin-scheduler` does with its database table.
- After `setup()`, `start()` removes the rules of names no slot defines — the scope is this plugin's alone, so every other rule under it is left over from an earlier version.
- A schedule handler is a closure, unlike a `JobExecutor` job, so it records its run on the service directly; the events report how each firing ended. Starting a rule is `addJob`, which leaves an unchanged rule alone and replans a changed one, and stopping it is `removeJob`, which removes it for every instance.
- `shutdown()` unsubscribes and shuts the executor down, which keeps the rules for the next start.

The rules are shared by the whole application, so every change is announced on the public `jobs-example:schedules` realtime topic with the rule's name and nothing else, and the page reads the rules again through the authenticated `GET /api/jobs-example/schedule`. `POST /api/jobs-example/schedule/:name/start`, optionally with `{ "every": 10000 }`, and `POST /api/jobs-example/schedule/:name/stop` change a rule and answer `204`. Run history is what this instance ran: with several instances on Redis, each firing runs on one of them, so a page shows only the runs of the instance it asked, while the next firing it shows is the backend's.

## One-off jobs

`server/job/provider.ts` owns the `JobExecutor`, and `client/pages/jobs.tsx` is its page.

- `ProgressJob` extends `Job`, declares its own stable `static jobName`, and takes nothing but its payload. It works for ten seconds and calls `reportProgress` with 10% more after each second. It sits in `server/job/`, outside `server/jobs/`, which the separate `@nocobase/queue` contract discovers automatically.
- A job cannot reach services, so it reports progress through its execution context and the provider does the rest: it subscribes to the executor's `JobStart`, `JobProgress`, `JobEnd` and `JobError` events, keeps each task's record in memory, and publishes every change on the user-audience `jobs-example:tasks` realtime topic for the user who created the task.
- `start()` defines the topic, subscribes to the executor, registers `ProgressJob`, and then calls `setup()`, which starts consuming. Registering before setup is what lets a task left over from an earlier run find its handler.
- Each step waits on the attempt's `AbortSignal`. When shutdown aborts a task before it finishes, the wait rejects with the signal's reason, so the task goes back to waiting instead of spending a failure attempt, and the next start runs it again from 0%.
- `shutdown()` shuts the executor down, which waits for running tasks, then unsubscribes and closes the topic.

The page's button sends `POST /api/jobs-example/job`, which answers `202` with the queued task, and every created task becomes a block whose progress bar follows the pushed updates. The page loads `GET /api/jobs-example/job` and subscribes to the topic when it opens, and unsubscribes when it closes; the realtime client connects on the first subscription and disconnects once nothing is subscribed. Because pushes are not replayed, it reloads the list whenever the connection opens again.

Task records are this example's in-memory view: a restart clears them, while the jobs service still recovers a pending task and runs it without an owner to show it to.

## Backends

On the `memory` jobs adapter, the application's default, both executors run in one process and their state is written under `storage/jobs` when the application stops; set `jobs.default` to `redis` to run each firing and each task once across several instances. A recovered firing or task can run again after its effects happened, so key real work by `jobId`. See the `@nocobase/jobs` README for the full contract.
