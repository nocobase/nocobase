:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/plugin-development/server/telemetry)をご参照ください。
:::

# テレメトリ

:::warning{title=実験的}
:::

NocoBase のテレメトリ (Telemetry) モジュールは、<a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a> をベースにラップされています。この記事では、テレメトリモジュールを使用してトレース (Trace) やメトリクス (Metric) データを収集し、NocoBase システムのオブザーバビリティ (Observability) を向上させる方法について説明します。

## インストルメンテーション

### メトリクス

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

参考：

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter</a>

### トレース

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

参考:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer</a>

### ライブラリ

```ts
import { Plugin } from '@nocobase/server';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

class InstrumentationPlugin extends Plugin {
  afterAdd() {
    this.app.on('beforeLoad', (app) => {
      app.telemetry.addInstrumentation(getNodeAutoInstrumentations());
    });
  }
}
```

:::warning{title=注意}
NocoBase におけるテレメトリモジュールの初期化位置は `app.beforeLoad` です。そのため、すべてのインストルメンテーションライブラリが NocoBase に適しているわけではありません。  
例えば、<a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a> は `Koa` のインスタンス化の前にインポートする必要があります。NocoBase の `Application` は `Koa` をベースにしていますが、テレメトリモジュールは `Application` のインスタンス化の後に初期化されるため、適用することができません。
:::

参考:

- <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">https://opentelemetry.io/docs/instrumentation/js/libraries/</a>

## 収集

### メトリクス

```ts
import { Plugin } from '@nocobase/server';
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';

class MetricReaderPlugin extends Plugin {
  afterAdd() {
    this.app.on('beforeLoad', (app) => {
      app.telemetry.metric.registerReader(
        'console',
        () =>
          new PeriodicExportingMetricReader({
            exporter: new ConsoleMetricExporter(),
          }),
      );
    });
  }
}
```

### トレース

```ts
import { Plugin } from '@nocobase/server';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from '@opentelemetry/sdk-trace-base';

class TraceSpanProcessorPlugin extends Plugin {
  afterAdd() {
    this.app.on('beforeLoad', (app) => {
      app.telemetry.trace.registerProcessor(
        'console',
        () => new BatchSpanProcessor(new ConsoleSpanExporter()),
      );
    });
  }
}
```

参考：

- <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">https://opentelemetry.io/docs/instrumentation/js/exporters</a>