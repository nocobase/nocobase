---
title: "Telemetry Telemetri"
description: "Telemetri server NocoBase: metrik, tracing, observability, Telemetry API."
keywords: "Telemetry,telemetri,metrik,tracing,observability,NocoBase"
---

# Telemetry Telemetri

:::warning Perhatian

Fitur ini saat ini bersifat eksperimental.

:::

Modul telemetri (Telemetry) NocoBase berbasis pada <a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a>, digunakan untuk mengumpulkan data trace dan metrik monitoring (Metric), meningkatkan observability NocoBase.

## Instrumentasi

### Metrik

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

Untuk penggunaan detail lihat <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">OpenTelemetry - Acquiring a Meter</a>.

### Trace

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

Untuk penggunaan detail lihat <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">OpenTelemetry - Acquiring a Tracer</a>.

### Library Tools

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

:::warning Perhatian

Lokasi inisialisasi modul telemetri di NocoBase adalah `app.beforeLoad`, sehingga tidak semua library instrumentasi cocok untuk NocoBase.
Misalnya <a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a> perlu di-import sebelum `Koa` di-instansiasi, sedangkan `Application` NocoBase meskipun berbasis `Koa`, modul telemetrinya baru diinisialisasi setelah `Application` di-instansiasi, sehingga tidak dapat digunakan.

:::

Untuk penggunaan detail lihat <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">OpenTelemetry - Libraries</a>.

## Pengumpulan

### Metrik

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

### Trace

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

Untuk penggunaan detail lihat <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">OpenTelemetry - Exporters</a>.

## Tautan Terkait

- [Logger Log](./logger.md) — Log dan telemetri digunakan bersama, melengkapi solusi observability
- [Plugin](./plugin.md) — Mendaftarkan instrumentasi telemetri dan collector di plugin
- [Ikhtisar Pengembangan Server](./index.md) — Posisi modul telemetri dalam arsitektur server
- [Event](./event.md) — Menginisialisasi telemetri di `beforeLoad` melalui mekanisme event
- [Middleware](./middleware.md) — Menggabungkan telemetri di middleware untuk tracing rantai request
