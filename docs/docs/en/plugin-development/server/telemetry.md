---
title: "Telemetry"
description: "NocoBase server telemetry: metrics, traces, observability, Telemetry API."
keywords: "Telemetry,metrics,traces,observability,NocoBase"
---

# Telemetry

:::warning Note

This feature is currently experimental.

:::

NocoBase's Telemetry module is encapsulated based on <a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a>, used for collecting Trace and Metric data to enhance the observability of NocoBase.

## Instrumentation

### Metrics

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

For detailed usage, see <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">OpenTelemetry - Acquiring a Meter</a>.

### Traces

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

For detailed usage, see <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">OpenTelemetry - Acquiring a Tracer</a>.

### Libraries

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

:::warning Note

In NocoBase, the initialization location of the telemetry module is `app.beforeLoad`. Therefore, not all instrumentation libraries are suitable for NocoBase.
For example, <a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a> needs to be introduced before `Koa` is instantiated, but although NocoBase's `Application` is based on `Koa`, the telemetry module is initialized after the `Application` is instantiated, so it cannot be used.

:::

For detailed usage, see <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">OpenTelemetry - Libraries</a>.

## Collection

### Metrics

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

For detailed usage, see <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">OpenTelemetry - Exporters</a>.

## Related Links

- [Logger](./logger.md) — Using logging alongside telemetry for a complete observability solution
- [Plugin](./plugin.md) — Register telemetry instrumentation and collectors in plugins
- [Server Development Overview](./index.md) — The position of the telemetry module in server architecture
- [Event](./event.md) — Initialize telemetry in `beforeLoad` through the event mechanism
- [Middleware](./middleware.md) — Combine telemetry with middleware for request tracing
