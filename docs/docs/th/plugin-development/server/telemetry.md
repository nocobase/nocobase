:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/plugin-development/server/telemetry)
:::

# Telemetry

:::warning{title=อยู่ในช่วงทดลอง}
:::

โมดูล Telemetry ของ NocoBase ถูกพัฒนาขึ้นโดยอ้างอิงจาก <a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a> บทความนี้จะแนะนำวิธีการใช้โมดูล Telemetry เพื่อรวบรวมข้อมูล Trace (การติดตามเส้นทาง) และ Metric (ตัวชี้วัด) เพื่อเพิ่มความสามารถในการสังเกตการณ์ (Observability) ของระบบ NocoBase ครับ

## การติดตั้งเครื่องมือ (Instrumentation)

### Metric (ตัวชี้วัด)

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

อ้างอิง:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter</a>

### Trace (การติดตามเส้นทาง)

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

อ้างอิง:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer</a>

### ไลบรารีเครื่องมือ

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

:::warning{title=ข้อควรระวัง}
ตำแหน่งการเริ่มต้นทำงาน (Initialization) ของโมดูล Telemetry ใน NocoBase คือ `app.beforeLoad` ดังนั้น จึงไม่ใช่ทุกไลบรารีสำหรับการติดตั้งเครื่องมือ (Instrumentation) ที่จะสามารถใช้งานกับ NocoBase ได้  
ตัวอย่างเช่น: <a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a> จำเป็นต้องถูกนำเข้าก่อนที่ `Koa` จะถูกสร้างอินสแตนซ์ (Instantiated) แต่เนื่องจากโมดูล Telemetry ของ NocoBase จะเริ่มต้นทำงานหลังจากที่ `Application` (ซึ่งอ้างอิงจาก `Koa`) ถูกสร้างอินสแตนซ์แล้ว จึงไม่สามารถใช้งานร่วมกันได้ครับ
:::

อ้างอิง:

- <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">https://opentelemetry.io/docs/instrumentation/js/libraries/</a>

## การรวบรวมข้อมูล (Collection)

### Metric (ตัวชี้วัด)

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

### Trace (การติดตามเส้นทาง)

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

อ้างอิง:

- <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">https://opentelemetry.io/docs/instrumentation/js/exporters</a>