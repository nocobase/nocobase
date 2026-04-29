---
title: "CronJobManager 定時タスク"
description: "NocoBase 定時タスク：app.cronJobManager、cron 式、定時タスクの登録とスケジューリング。"
keywords: "CronJobManager,定時タスク,cron,app.cronJobManager,タスクスケジューリング,NocoBase"
---

# CronJobManager 定時タスク管理

`CronJobManager` は NocoBase が提供する定時タスク管理機能で、[cron](https://www.npmjs.com/package/cron) をベースとして実装されています。プラグイン内で定時タスクを登録し、特定のロジックを周期的に実行することができます。

## 基本的な使い方

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *',       // 毎日 00:00 に実行
      onTick: async () => {
        console.log('日次タスク：一時データをクリーンアップ');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true,                  // 自動起動
    });
  }

  async cleanTemporaryData() {
    // ここにクリーンアップロジックを記述します
  }
}
```

## パラメーターの説明

`CronJobParameters` の型定義は以下の通りです（[cron](https://www.npmjs.com/package/cron) から引用）：

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

| パラメーター  | 型  | 説明  |
| ---------------- | ---------- | ---------- |
| **cronTime**     | `string \| Date \| DateTime` | 定時タスクの時刻指定式です。標準の cron 式をサポートしており、例えば `0 0 * * *` は毎日 00:00 に実行されることを示します。 |
| **onTick**       | `function` | タスクの本体となる関数です。指定された時刻にトリガーされます。                         |
| **onComplete**   | `function` | タスクが `job.stop()` で停止されたとき、または `onTick` が完了を通知したときに実行されます。 |
| **timeZone**     | `string`   | 実行するタイムゾーンを指定します（例：`Asia/Shanghai`）。  |
| **context**      | `any`      | `onTick` 実行時のコンテキストです。  |
| **runOnInit**    | `boolean`  | 初期化時にすぐに 1 回実行するかどうかを指定します。  |
| **utcOffset**    | `string \| number`  | タイムゾーンのオフセットを指定します。   |
| **unrefTimeout** | `boolean`  | イベントループがアクティブな状態を維持するかどうかを制御します。  |

## Cron 式の例

| 式            | 意味           |
| -------------- | ------------ |
| `* * * * *`    | 1 分ごとに実行      |
| `0 * * * *`    | 1 時間ごとに実行      |
| `0 0 * * *`    | 毎日 00:00 に実行  |
| `0 9 * * 1`    | 毎週月曜日 09:00 に実行 |
| `*/10 * * * *` | 10 分ごとに実行  |

:::tip 提示

[crontab.guru](https://crontab.guru/) を使用すると、cron 式の生成に役立ちます。

:::

## タスクの起動と停止

`addJob()` は job オブジェクトを返します。これを使用してタスクを手動で制御できます：

```ts
const job = app.cronJobManager.addJob({ ... });
job.start();  // タスクを起動
job.stop();   // タスクを停止
```

:::tip 提示

定時タスクはアプリケーションの起動と停止に連動します。通常、手動で `start()` や `stop()` を呼び出す必要はありません。

:::

## 関連リンク

- [Plugin プラグイン](./plugin.md) — プラグインのライフサイクルとコア API
- [Event イベントシステム](./event.md) — アプリケーションイベントのリッスンとトリガー
- [サーバーサイド開発の概要](./index.md) — サーバーサイドの各モジュール一覧
- [プラグイン開発の概要](../index.md) — プラグイン開発の全体紹介
