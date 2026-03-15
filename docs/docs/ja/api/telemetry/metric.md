:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/api/telemetry/metric)をご参照ください。
:::

# Metric

## クラスメソッド

### `constructor()`

コンストラクタです。`Metric` インスタンスを作成します。

#### シグネチャ

- `constructor(options?: MetricOptions)`

#### 型

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### 詳細

| プロパティ     | 型                     | 説明                                   | デフォルト値              |
| ------------ | ---------------------- | -------------------------------------- | ------------------- |
| `meterName`  | `string`               | meter 識別子                             | `nocobase-meter`    |
| `version`    | `string`               |                                        | NocoBase の現在のバージョン番号 |
| `readerName` | `string` \| `string[]` | 有効にする登録済み `MetricReader` の識別子 |                     |

### `init()`

`MetricProvider` を初期化します。

#### シグネチャ

- `init(): void`

### `registerReader()`

`MetricReader` を登録します。

#### シグネチャ

- `registerReader(name: string, reader: GetMetricReader)`

#### 型

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### 詳細

| 引数        | 型                   | 説明                       |
| ----------- | -------------------- | -------------------------- |
| `name`      | `string`             | `MetricReader` の一意識別子    |
| `reader`    | `() => MetricReader` | `MetricReader` を取得するメソッド |

### `addView()`

`View` を追加します。<a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a> を参照してください。

#### シグネチャ

- `addView(...view: View[])`

#### 型

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

`Meter` を取得します。

#### シグネチャ

- `getMeter(name?: string, version?: string)`

#### 詳細

| 引数      | 型       | 説明       | デフォルト値              |
| --------- | -------- | ---------- | ------------------- |
| `name`    | `string` | meter 識別子 | `nocobase-meter`    |
| `version` | `string` |            | NocoBase の現在のバージョン番号 |

### `start()`

`MetricReader` を起動します。

#### シグネチャ

- `start(): void`

### `shutdown()`

`MetricReader` を停止します。

#### シグネチャ

- `shutdown(): Promise<void>`