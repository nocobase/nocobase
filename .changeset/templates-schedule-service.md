---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-skills': patch
---

Compose the jobs service, and replace `@nocobase/cron` with `@nocobase/jobs`

The templates add `JobExecutorServiceProvider` to `server/app.ts`, a `server/config/jobs.ts` offering a `memory` and a `redis` configuration, and `@nocobase/jobs` as a dependency, and remove the Scheduler's `queues.schedule` queue connection. The default and examples templates also add `server/config/scheduler.ts`, where `scheduler.jobs` or `SCHEDULER_JOBS` selects the `jobs` configuration Scheduler runs on. No configuration is the default: until `jobs.default` names one, scheduled jobs run on the built-in memory adapter — one process, its state written under `storage/jobs` when the application stops — and a warning reports it outside development. Set `jobs.default` to `redis` in `config.yml` to run several instances, each firing executed once; Redis must persist its data and use `maxmemory-policy noeviction`.

`@nocobase/cron` is no longer part of the templates or of this repository; its published 0.1.0 stays installable. Code that scheduled work with `createCronJobManager()` moves to an executor of its own, which also stops several instances from each firing the job:

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';

this.executor = this.app.container
  .resolve(jobExecutorServiceToken)
  .getScheduleExecutor('<your package name>');
await this.executor.addJob({
  name: 'overdue-scan',
  options: { cron: '0 8 * * *', tz: 'Asia/Shanghai' },
  payload: {},
  execute: async () => {
    /* ... */
  },
});
await this.executor.setup(); // in start(); call this.executor.shutdown() in shutdown()
```

The application development Skill describes this in its services and jobs reference, and the deployment Skill covers choosing the schedule backend.
