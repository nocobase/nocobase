:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/plugin-development/server/telemetry) voor nauwkeurige informatie.
:::

# Telemetrie

:::warning{title=Experimenteel}
:::

De telemetrie-module van NocoBase is ingekapseld op basis van <a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a>. Dit artikel beschrijft hoe u de telemetrie-module kunt gebruiken om Trace- en Metric-gegevens te verzamelen om de observeerbaarheid (Observability) van het NocoBase-systeem te verbeteren.

## Instrumentatie

### Metrieken

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

Referenties:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter</a>

### Traces

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

Referenties:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer</a>

### Bibliotheken

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

:::warning{title=Let op}
In NocoBase is de initialisatielocatie van de telemetrie-module `app.beforeLoad`. Daarom zijn niet alle instrumentatie-bibliotheken geschikt voor NocoBase.  
Bijvoorbeeld: <a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a> moet worden geïntroduceerd voordat `Koa` wordt geïnstantieerd. Hoewel de `Application` van NocoBase is gebaseerd op `Koa`, wordt de telemetrie-module pas geïnitialiseerd nadat de `Application` is geïnstantieerd, waardoor deze niet kan worden toegepast.
:::

Referenties:

- <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">https://opentelemetry.io/docs/instrumentation/js/libraries/</a>

## Verzameling

### Metrieken

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

### Traces

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

Referenties:

- <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">https://opentelemetry.io/docs/instrumentation/js/exporters</a>