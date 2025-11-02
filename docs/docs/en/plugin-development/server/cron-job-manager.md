# CronJobManager Scheduled Task Management

`CronJobManager` is a scheduled task manager provided by NocoBase, based on [cron](https://www.npmjs.com/package/cron). It allows plugins to register scheduled tasks on the server-side to periodically execute specific logic.

## Basic Usage

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Executes at 00:00 every day
      onTick: async () => {
        console.log('Daily task: Clean up temporary data');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Start automatically
    });
  }

  async cleanTemporaryData() {
    // Execute cleanup logic here
  }
}
```

## Parameter Description

The `CronJobParameters` type is defined as follows (from [cron](https://www.npmjs.com/package/cron)):

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

| Parameter        | Type                         | Description                                                                                                                              |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **cronTime**     | `string \| Date \| DateTime` | The time expression for the scheduled task. Supports standard cron expressions, for example, `0 0 * * *` means execute at 00:00 every day. |
| **onTick**       | `function`                   | The main function of the task. It will be triggered at the specified time.                                                               |
| **onComplete**   | `function`                   | Executed when the job is stopped by `job.stop()` or when `onTick` completes its execution.                                               |
| **timeZone**     | `string`                     | Specifies the execution time zone (e.g., `Asia/Shanghai`).                                                                               |
| **context**      | `any`                        | The context for executing `onTick`.                                                                                                      |
| **runOnInit**    | `boolean`                    | Whether to execute the job once immediately upon initialization.                                                                         |
| **utcOffset**    | `string \| number`           | Specifies the UTC offset.                                                                                                                |
| **unrefTimeout** | `boolean`                    | Controls whether the event loop remains active.                                                                                          |

## Cron Expression Examples

| Expression     | Meaning                     |
| -------------- | --------------------------- |
| `* * * * *`    | Execute once every minute   |
| `0 * * * *`    | Execute once every hour     |
| `0 0 * * *`    | Execute at 00:00 every day  |
| `0 9 * * 1`    | Execute at 09:00 every Monday |
| `*/10 * * * *` | Execute once every 10 minutes |

> 💡 You can use [crontab.guru](https://crontab.guru/) to help generate expressions.

## Controlling Job Start and Stop

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Start the job
job.stop();  // Stop the job
```

:::tip

Scheduled tasks start and stop along with the application. You typically do not need to manually `start` or `stop` them unless necessary.

:::