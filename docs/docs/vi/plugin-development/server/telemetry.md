:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/plugin-development/server/telemetry).
:::

# Telemetry

:::warning{title=Thử nghiệm}
:::

Module Telemetry của NocoBase được đóng gói dựa trên <a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a>. Bài viết này giới thiệu cách sử dụng module Telemetry để thu thập dữ liệu truy vết (Trace) và chỉ số (Metric) nhằm tăng cường khả năng quan sát (Observability) cho hệ thống NocoBase.

## Chèn mã (Instrumentation)

### Chỉ số (Metrics)

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

Tham khảo:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter</a>

### Truy vết (Traces)

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

Tham khảo:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer</a>

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

:::warning{title=Lưu ý}
Vị trí khởi tạo của module Telemetry trong NocoBase là `app.beforeLoad`. Do đó, không phải tất cả các thư viện chèn mã (instrumentation) đều phù hợp với NocoBase.  
Ví dụ: <a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a> cần được đưa vào trước khi `Koa` được khởi tạo (instantiated), trong khi `Application` của NocoBase mặc dù dựa trên `Koa`, nhưng module Telemetry chỉ được khởi tạo sau khi `Application` đã khởi tạo, vì vậy nó không thể áp dụng được.
:::

Tham khảo:

- <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">https://opentelemetry.io/docs/instrumentation/js/libraries/</a>

## Thu thập (Collection)

### Chỉ số (Metrics)

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

### Truy vết (Traces)

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

Tham khảo:

- <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">https://opentelemetry.io/docs/instrumentation/js/exporters</a>