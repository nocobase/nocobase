---
title: "CronJobManager"
description: "NocoBase scheduled tasks: app.cronJobManager, cron expressions, registering and scheduling tasks."
keywords: "CronJobManager,scheduled tasks,cron,app.cronJobManager,task scheduling,NocoBase"
---

# CronJobManager

`CronJobManager` is a scheduled task manager provided by NocoBase, based on [cron](https://www.npmjs.com/package/cron). You can register scheduled tasks in your plugins for periodically executing specific logic.

## Basic Usage

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *',       // Execute daily at 00:00
      onTick: async () => {
        console.log('Daily task: clean temporary data');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true,                  // Auto start
    });
  }

  async cleanTemporaryData() {
    // Execute cleanup logic here
  }
}
```

## Parameter Description

The `CronJobParameters` type definition is as follows (from [cron](https://www.npmjs.com/package/cron)):

```ts
export declare interface CronJobParameters {
  cronTime: string | Date | DateTime;
  onTick: CronCommand;
  onComplete?: CronCommand | null;
  start?: boolean;
  timeZone?: string;
  context?: any;
  runOnInit?: boolean;
  utcOffset?: string | number;
  unrefTimeout?: boolean;
}
```

| Parameter     | Type                        | Description |
| ------------- | --------------------------- | ----------- |
| **cronTime**  | `string \| Date \| DateTime` | Scheduled task time expression. Supports standard cron expressions, for example `0 0 * * *` means execute daily at 00:00. |
| **onTick**    | `function`                  | Task main function. Will be triggered at the specified time. |
| **onComplete** | `function`                  | Executes when the task is stopped by `job.stop()` or after the `onTick` function completes. |
| **timeZone**  | `string`                    | Specify the execution time zone (e.g., `Asia/Shanghai`). |
| **context**   | `any`                       | Context when executing `onTick`. |
| **runOnInit** | `boolean`                   | Whether to execute once immediately on initialization. |
| **utcOffset** | `string \| number`           | Specify the time zone offset. |
| **unrefTimeout** | `boolean`                  | Controls whether the event loop stays active. |

## Cron Expression Examples

| Expression        | Meaning                    |
| ----------------- | -------------------------- |
| `* * * * *`       | Execute every minute       |
| `0 * * * *`       | Execute every hour         |
| `0 0 * * *`       | Execute daily at 00:00      |
| `0 9 * * 1`       | Execute every Monday at 09:00 |
| `*/10 * * * *`    | Execute every 10 minutes   |

:::tip

You can use [crontab.guru](https://crontab.guru/) to help generate cron expressions.

:::

## Control Task Start and Stop

`addJob()` returns a job object that you can use to manually control the task:

```ts
const job = app.cronJobManager.addJob({ ... });
job.start();  // Start task
job.stop();   // Stop task
```

:::tip

Scheduled tasks start and stop along with the application. You generally don't need to manually call `start()` or `stop()`.

:::

## Related Links

- [Plugin](./plugin.md) - Plugin lifecycle and core APIs
- [Event](./event.md) - Application event listening and triggering
- [Server Development Overview](./index.md) - Overview of all server modules
- [Plugin Development Overview](../index.md) - Overall introduction to plugin development
