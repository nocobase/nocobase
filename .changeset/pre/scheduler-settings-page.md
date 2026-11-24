---
'@nocobase/app-plugin-scheduler': minor
'@nocobase/app-server': minor
'@nocobase/app-plugin-foundation': patch
---

Add the Schedules System settings page at `/settings/automation/schedules`, registered by the Scheduler client plugin, with three tabs: Tasks (state, rule, next and last run, totals, pause and resume, each Schedule's detail and runs), Runs (the history of every Schedule, filtered by Schedule, result and time range) and Configuration (the jobs configuration Schedules run on, read-only, and the Schedules still active in the database that the running code no longer defines). Replace the page with `routeComponentOverrides` under `@nocobase/app-plugin-scheduler:schedules`.

Fix the Scheduler permissions: the API now checks the `scheduler.schedules` settings item the role editor offers instead of a page grant that did not exist, so a role granted Schedules · Read can use it. Its reading routes check `read`, and enabling and disabling check the new `manage` action (403 `SCHEDULE_MANAGE_REQUIRED` without it).

List items gain `sourceType`, `from`, `to`, `limit` and `lastRun` (the latest run's status, reason and finish time); the list's `meta.jobs` describes the jobs configuration and where each value comes from, without passwords, and lists `removedFromCode`; the detail gains `upcomingRuns`; and `GET /api/scheduler/occurrences` returns the history of every Schedule, filtered by `scheduleId`, `status`, `from` and `to`, cursor-paged by each run's planned time. A migration fills in the planned time of runs recorded before it was kept and adds two indexes to the occurrence table.

`AppConfigAccessor` gains the optional `layers()`, `environmentVariableMappings()` and `loadedEnvironmentVariables()` methods, so a plugin can tell whether a value comes from `config.yml`, the application's own environment variables or a default. The capability guide's scheduler steps name the new page and permissions.
