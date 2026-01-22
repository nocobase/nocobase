:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# टेलीमेट्री

:::warning{title=प्रायोगिक}
:::

NocoBase का टेलीमेट्री मॉड्यूल <a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a> पर आधारित है। यह लेख बताता है कि NocoBase सिस्टम की ऑब्जर्वेबिलिटी (Observability) को बेहतर बनाने के लिए टेलीमेट्री मॉड्यूल का उपयोग करके ट्रेस (Trace) और मेट्रिक्स (Metric) डेटा कैसे एकत्र किया जाए।

## इंस्ट्रूमेंटेशन

### मेट्रिक्स

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

संदर्भ:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter</a>

### ट्रेस

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

संदर्भ:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer</a>

### लाइब्रेरीज़

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

:::warning{title=ध्यान दें}
NocoBase में टेलीमेट्री मॉड्यूल के इनिशियलाइज़ेशन की जगह `app.beforeLoad` है। इसलिए, सभी इंस्ट्रूमेंटेशन लाइब्रेरीज़ NocoBase के लिए उपयुक्त नहीं हैं।  
उदाहरण के लिए: <a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a> को `Koa` के इंस्टेंशिएट होने से पहले इम्पोर्ट करना होगा, लेकिन NocoBase का `Application` भले ही `Koa` पर आधारित हो, टेलीमेट्री मॉड्यूल `Application` के इंस्टेंशिएट होने के बाद ही इनिशियलाइज़ होता है, इसलिए इसे लागू नहीं किया जा सकता।
:::

संदर्भ:

- <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">https://opentelemetry.io/docs/instrumentation/js/libraries/</a>

## संग्रह

### मेट्रिक्स

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

### ट्रेस

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

संदर्भ:

- <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">https://opentelemetry.io/docs/instrumentation/js/exporters</a>