:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/plugin-development/server/telemetry) bakın.
:::

# Telemetri

:::warning{title=Deneysel}
:::

NocoBase'in telemetri (telemetry) modülü, <a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a> temel alınarak kapsüllenmiştir. Bu makale, NocoBase sisteminin gözlemlenebilirliğini (observability) artırmak için izleme (trace) ve metrik (metric) verilerini toplamak üzere telemetri modülünün nasıl kullanılacağını tanıtmaktadır.

## Enstrümantasyon (Instrumentation)

### Metrikler

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

Referanslar:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter</a>

### İzlemeler (Traces)

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

Referanslar:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer</a>

### Kütüphaneler

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

:::warning{title=Not}
NocoBase'de telemetri modülünün başlatılma konumu `app.beforeLoad` şeklindedir. Bu nedenle, tüm enstrümantasyon kütüphaneleri NocoBase için uygun değildir.  
Örneğin: <a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a>'nın `Koa` örneği oluşturulmadan önce dahil edilmesi gerekir; ancak NocoBase'in `Application` yapısı `Koa` tabanlı olsa da, telemetri modülü `Application` örneği oluşturulduktan sonra başlatılır, bu yüzden kullanılamaz.
:::

Referanslar:

- <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">https://opentelemetry.io/docs/instrumentation/js/libraries/</a>

## Toplama (Collection)

### Metrikler

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

### İzlemeler (Traces)

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

Referanslar:

- <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">https://opentelemetry.io/docs/instrumentation/js/exporters</a>