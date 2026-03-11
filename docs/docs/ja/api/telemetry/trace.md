:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/api/telemetry/trace)をご参照ください。
:::

# Trace

## クラスメソッド

### `constructor()`

`Trace` インスタンスを作成するコンストラクタです。

#### シグネチャ

- `constructor(options?: TraceOptions)`

#### 型

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### 詳細

| プロパティ      | 型                     | 説明                                    | デフォルト値              |
| --------------- | ---------------------- | --------------------------------------- | ------------------------- |
| `tracerName`    | `string`               | トレース識別子                          | `nocobase-trace`          |
| `version`       | `string`               |                                         | NocoBase の現在のバージョン番号 |
| `processorName` | `string` \| `string[]` | 有効にしたい登録済み `SpanProcessor` の識別子 |                           |

### `init()`

`NodeTracerProvider` を初期化します。

#### シグネチャ

- `init(): void`

### `registerProcessor()`

`SpanProcessor` を登録します。

#### シグネチャ

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### 型

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### 詳細

| パラメータ  | 型                    | 説明                        |
| ----------- | --------------------- | --------------------------- |
| `name`      | `string`              | `SpanProcessor` の一意の識別子 |
| `processor` | `() => SpanProcessor` | `SpanProcessor` を取得するメソッド |

### `getTracer()`

`Tracer` を取得します。

#### シグネチャ

- `getTracer(name?: string, version?: string)`

#### 詳細

| パラメータ | 型       | 説明       | デフォルト値              |
| ---------- | -------- | ---------- | ------------------------- |
| `name`     | `string` | トレース識別子 | `nocobase-trace`          |
| `version`  | `string` |            | NocoBase の現在のバージョン番号 |

### `start()`

`SpanProcessor` を開始します。

#### シグネチャ

- `start(): void`

### `shutdown()`

`SpanProcessor` を停止します。

#### シグネチャ

- `shutdown(): Promise<void>`