# CronJobManager — управление запланированными задачами

`CronJobManager` — это менеджер запланированных задач, предоставляемый NocoBase на основе [cron](https://www.npmjs.com/package/cron). Он позволяет плагинам регистрировать запланированные задачи на сервере для периодического выполнения определенной логики.

## Базовое использование

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Выполнять ежедневно в 00:00
      onTick: async () => {
        console.log('Daily task: clean temporary data');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Автозапуск
    });
  }

  async cleanTemporaryData() {
    // Выполнить логику очистки здесь
  }
}
```

## Описание параметров

Определение типа `CronJobParameters` выглядит следующим образом (из [cron](https://www.npmjs.com/package/cron)):

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

| Параметр | Тип | Описание |
| ------------- | --------------------------- | ----------- |
| **cronTime** | `string \| Date \| DateTime` | Выражение времени запланированной задачи. Поддерживает стандартные выражения cron, например `0 0 * * *` означает выполнение ежедневно в 00:00. |
| **onTick** | `function` | Основная функция задачи. Будет вызвана в указанное время. |
| **onComplete** | `function` | Выполняется, когда задача останавливается через `job.stop()` или после завершения функции `onTick`. |
| **timeZone** | `string` | Указывает часовой пояс выполнения (например, `Asia/Shanghai`). |
| **context** | `any` | Контекст при выполнении `onTick`. |
| **runOnInit** | `boolean` | Следует ли выполнять один раз сразу при инициализации. |
| **utcOffset** | `string \| number` | Укажите смещение часового пояса. |
| **unrefTimeout** | `boolean` | Определяет, остается ли цикл событий активным. |

## Примеры cron-выражений

| Выражение | Значение |
| ----------------- | -------------------------- |
| `* * * * *` | Выполнять каждую минуту |
| `0 * * * *` | Выполнять каждый час |
| `0 0 * * *` | Выполнять ежедневно в 00:00 |
| `0 9 * * 1` | Выполнять каждый понедельник в 09:00 |
| `*/10 * * * *` | Выполнять каждые 10 минут |

> 💡 Вы можете использовать [crontab.guru](https://crontab.guru/) для создания выражений.

## Управление запуском и остановкой задач

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Запустить задачу
job.stop();  // Остановить задачу
```

:::tip

Запланированные задачи запускаются и останавливаются вместе с приложением. Обычно вам не нужно запускать или останавливать их вручную.

:::