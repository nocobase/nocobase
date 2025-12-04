:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# טלמטריה

:::warning{title=ניסיוני}
:::

מודול הטלמטריה של NocoBase מבוסס על <a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a>. מאמר זה מתאר כיצד להשתמש במודול הטלמטריה כדי לאסוף נתוני עקבות (Trace) ומדדים (Metric) במטרה לשפר את יכולת התצפית (Observability) של מערכת NocoBase.

## אינסטרומנטציה

### מדדים

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

הפניות:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter</a>

### עקבות

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

הפניות:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer</a>

### ספריות

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

:::warning{title=שימו לב}
ב-NocoBase, מיקום האתחול של מודול הטלמטריה הוא `app.beforeLoad`. לכן, לא כל ספריות האינסטרומנטציה מתאימות ל-NocoBase.  
לדוגמה, <a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a> דורשת הטמעה לפני יצירת מופע של `Koa`, אך למרות ש-`Application` של NocoBase מבוסס על `Koa`, מודול הטלמטריה מאותחל רק לאחר יצירת מופע של `Application`, ולכן אינו ישים במקרה זה.
:::

הפניות:

- <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">https://opentelemetry.io/docs/instrumentation/js/libraries/</a>

## איסוף

### מדדים

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

### עקבות

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

הפניות:

- <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">https://opentelemetry.io/docs/instrumentation/js/exporters</a>