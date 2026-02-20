# CronJobManager 定时任务管理

`CronJobManager` 是 NocoBase 提供的一个基于 [cron](https://www.npmjs.com/package/cron) 的定时任务管理器。它允许插件在服务端注册定时任务，用于周期性执行特定逻辑。

## 基本用法

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // 每天 00:00 执行
      onTick: async () => {
        console.log('每日任务：清理临时数据');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // 自动启动
    });
  }

  async cleanTemporaryData() {
    // 在此执行清理逻辑
  }
}
```

## 参数说明

`CronJobParameters` 类型定义如下（来自 [cron](https://www.npmjs.com/package/cron)）：

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

| 参数  | 类型  | 说明  |
| ---------------- | ---------- | ---------- |
| **cronTime**     | `string \| Date \| DateTime` | 定时任务的时间表达式。支持标准 cron 表达式，例如 `0 0 * * *` 表示每天 00:00 执行。 |
| **onTick**       | `function` | 任务主体函数。将在指定时间被触发。                         |
| **onComplete**   | `function` | 当任务被 `job.stop()` 停止或 `onTick` 主动调用完成时执行。 | `false`。 | 
| **timeZone**     | `string`   | 指定执行时区（例如 `Asia/Shanghai`）。  |
| **context**      | `any`      | 执行 `onTick` 时的上下文。  |
| **runOnInit**    | `boolean`  | 是否在初始化时立即执行一次。  |
| **utcOffset**    | `string \| number`  | 指定时区偏移。   |
| **unrefTimeout** | `boolean`  | 控制事件循环是否保持活跃。  |

## Cron 表达式示例

| 表达式            | 含义           |
| -------------- | ------------ |
| `* * * * *`    | 每分钟执行一次      |
| `0 * * * *`    | 每小时执行一次      |
| `0 0 * * *`    | 每天 00:00 执行  |
| `0 9 * * 1`    | 每周一 09:00 执行 |
| `*/10 * * * *` | 每 10 分钟执行一次  |

> 💡 可以使用 [crontab.guru](https://crontab.guru/) 辅助生成表达式。

## 控制任务的启动与停止

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // 启动任务
job.stop();  // 停止任务
```

:::tip

定时任务会跟随应用启动时启动，应用停止时停止，如非必要通常你不需要，一般不需要手动 start 或 stop。

:::
