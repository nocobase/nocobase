:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# CronJobManager (定期実行タスク管理)

`CronJobManager` は、NocoBase が提供する [cron](https://www.npmjs.com/package/cron) をベースとした定期実行タスク管理機能です。プラグインがサーバーサイドで定期実行タスクを登録し、特定のロジックを周期的に実行できるようにします。

## 基本的な使い方

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // 毎日 00:00 に実行
      onTick: async () => {
        console.log('日次タスク：一時データをクリーンアップ');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // 自動起動
    });
  }

  async cleanTemporaryData() {
    // ここにクリーンアップロジックを記述します
  }
}
```

## パラメーターの説明

`CronJobParameters` の型定義は以下の通りです（[cron](https://www.npmjs.com/package/cron) から引用）。

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

| パラメーター     | 型                        | 説明                                                                                             |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------------------ |
| **cronTime**     | `string \| Date \| DateTime` | 定期実行タスクの時刻指定式です。標準の cron 式をサポートしており、例えば `0 0 * * *` は毎日 00:00 に実行されることを示します。 |
| **onTick**       | `function`                | タスクの本体となる関数です。指定された時刻にトリガーされます。                                   |
| **onComplete**   | `function`                | タスクが `job.stop()` によって停止されたとき、または `onTick` 関数が完了したときに実行されます。 |
| **timeZone**     | `string`                  | 実行するタイムゾーンを指定します（例: `Asia/Shanghai`）。                                        |
| **context**      | `any`                     | `onTick` 実行時のコンテキストです。                                                              |
| **runOnInit**    | `boolean`                 | 初期化時に一度だけすぐに実行するかどうかを指定します。                                           |
| **utcOffset**    | `string \| number`        | タイムゾーンのオフセットを指定します。                                                           |
| **unrefTimeout** | `boolean`                 | イベントループがアクティブな状態を維持するかどうかを制御します。                                 |

## Cron 式の例

| 式            | 意味           |
| -------------- | ------------ |
| `* * * * *`    | 1分ごとに実行      |
| `0 * * * *`    | 1時間ごとに実行      |
| `0 0 * * *`    | 毎日 00:00 に実行  |
| `0 9 * * 1`    | 毎週月曜日 09:00 に実行 |
| `*/10 * * * *` | 10分ごとに実行  |

> 💡 [crontab.guru](https://crontab.guru/) を利用すると、式の生成に役立ちます。

## タスクの起動と停止

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // タスクを起動
job.stop();  // タスクを停止
```

:::tip

定期実行タスクは、アプリケーションの起動とともに起動し、停止とともに停止します。特別な理由がない限り、通常は手動で `start` や `stop` を呼び出す必要はほとんどありません。

:::