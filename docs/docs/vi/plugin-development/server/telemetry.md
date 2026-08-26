---
title: "Telemetry"
description: "Telemetry phía server NocoBase: số liệu, truy vết, khả năng quan sát, Telemetry API."
keywords: "Telemetry,Số liệu,Truy vết,Khả năng quan sát,NocoBase"
---

# Telemetry

:::warning Lưu ý

Chức năng này hiện đang là chức năng thử nghiệm.

:::

Module Telemetry của NocoBase được đóng gói dựa trên <a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a>, dùng để thu thập dữ liệu Trace và Metric, tăng cường khả năng quan sát (Observability) của NocoBase.

## Instrumentation

### Số liệu

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

Cách dùng chi tiết xem tại <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">OpenTelemetry - Acquiring a Meter</a>.

### Truy vết

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

Cách dùng chi tiết xem tại <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">OpenTelemetry - Acquiring a Tracer</a>.

### Thư viện công cụ

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

:::warning Lưu ý

Vị trí khởi tạo module telemetry trong NocoBase là `app.beforeLoad`, do đó không phải tất cả các thư viện instrumentation đều phù hợp với NocoBase.
Ví dụ <a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a> cần được import trước khi `Koa` được khởi tạo, nhưng `Application` của NocoBase mặc dù dựa trên `Koa`, module telemetry chỉ được khởi tạo sau khi `Application` được khởi tạo, nên không thể dùng được.

:::

Cách dùng chi tiết xem tại <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">OpenTelemetry - Libraries</a>.

## Thu thập

### Số liệu

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

### Truy vết

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

Cách dùng chi tiết xem tại <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">OpenTelemetry - Exporters</a>.

## Liên kết liên quan

- [Logger](./logger.md) — Log kết hợp với telemetry để hoàn thiện phương án khả năng quan sát
- [Plugin](./plugin.md) — Đăng ký instrumentation telemetry và bộ thu thập trong Plugin
- [Tổng quan phát triển server](./index.md) — Vị trí của module telemetry trong kiến trúc server
- [Event](./event.md) — Khởi tạo telemetry trong `beforeLoad` thông qua cơ chế sự kiện
- [Middleware](./middleware.md) — Kết hợp telemetry để truy vết link request trong middleware
