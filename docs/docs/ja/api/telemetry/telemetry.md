:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/api/telemetry/telemetry)をご参照ください。
:::

# Telemetry

## 概览

`Telemetry` は NocoBase のテレメトリモジュールです。<a href="https://opentelemetry.io">OpenTelemetry</a> をベースにラップされており、OpenTelemetry エコシステムのメトリクス (Metric) およびトレース (Trace) ツールの登録をサポートしています。

## クラスメソッド

### `constructor()`

コンストラクタ。`Telemetry` インスタンスを作成します。

#### シグネチャ

- `constructor(options?: TelemetryOptions)`

#### 型

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### 詳細情報

| プロパティ | 型 | 説明 | デフォルト値 |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string` | 任意。<a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> を参照してください。 | `nocobase` |
| `version` | `string` | 任意。<a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> を参照してください。 | 任意、現在の NocoBase バージョン番号 |
| `trace` | `TraceOptions` | 任意。[Trace](./trace.md) を参照してください。 | |
| `metric` | `MetricOptions` | 任意。[Metric](./metric.md) を参照してください。 | |

### `init()`

インストルメンテーション（Instrumentation）を登録し、`Trace` と `Metric` を初期化します。

#### シグネチャ

- `init(): void`

### `start()`

Prometheus へのエクスポートなど、`Trace` や `Metric` 関連データの処理プログラムを開始します。

#### シグネチャ

- `start(): void`

### `shutdown()`

`Trace` や `Metric` 関連データの処理プログラムを停止します。

#### シグネチャ

- `shutdown(): Promise<void>`

### `addInstrumentation()`

インストルメンテーションライブラリを追加します。

#### シグネチャ

- `addInstrumentation(...instrumentation: InstrumentationOption[])`