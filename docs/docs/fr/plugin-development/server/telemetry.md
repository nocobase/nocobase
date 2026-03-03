:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/plugin-development/server/telemetry).
:::

# Télémétrie

:::warning{title=Expérimental}
:::

Le module de télémétrie (Telemetry) de NocoBase est encapsulé sur la base d'<a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a>. Cet article présente comment utiliser le module de télémétrie pour collecter des données de traces (Trace) et de métriques (Metric) afin d'améliorer l'observabilité (Observability) du système NocoBase.

## Instrumentation

### Métriques

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

Références :

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter</a>

### Traces

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

Références :

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer</a>

### Bibliothèques d'outils

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

:::warning{title=Attention}
Dans NocoBase, l'emplacement d'initialisation du module de télémétrie est `app.beforeLoad`. Par conséquent, toutes les bibliothèques d'instrumentation ne sont pas adaptées à NocoBase.  
Par exemple : <a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a> doit être introduit avant l'instanciation de `Koa`. Bien que l'`Application` de NocoBase soit basée sur `Koa`, le module de télémétrie est initialisé après l'instanciation de l'`Application`, il ne peut donc pas être appliqué.
:::

Références :

- <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">https://opentelemetry.io/docs/instrumentation/js/libraries/</a>

## Collecte

### Métriques

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

Références :

- <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">https://opentelemetry.io/docs/instrumentation/js/exporters</a>