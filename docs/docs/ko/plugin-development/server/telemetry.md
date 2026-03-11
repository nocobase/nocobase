:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/plugin-development/server/telemetry)을 참조하세요.
:::

# 텔레메트리 (Telemetry)

:::warning{title=실험적 기능}
:::

NocoBase의 텔레메트리(Telemetry) 모듈은 <a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a>를 기반으로 캡슐화되었습니다. 이 문서는 텔레메트리 모듈을 사용하여 트레이스(Trace) 및 메트릭(Metric) 데이터를 수집하고 NocoBase 시스템의 관측 가능성(Observability)을 향상시키는 방법을 소개합니다.

## 계측 (Instrumentation)

### 메트릭 (Metrics)

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

참고:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter</a>

### 트레이스 (Traces)

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

참고:

- <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer</a>

### 라이브러리

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

:::warning{title=주의}
NocoBase에서 텔레메트리 모듈의 초기화 위치는 `app.beforeLoad`입니다. 따라서 모든 계측 라이브러리가 NocoBase에 적합한 것은 아닙니다.  
예를 들어: <a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a>는 `Koa`가 인스턴스화되기 전에 도입되어야 합니다. NocoBase의 `Application`은 `Koa`를 기반으로 하지만, 텔레메트리 모듈은 `Application`이 인스턴스화된 후에 초기화되므로 적용할 수 없습니다.
:::

참고:

- <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">https://opentelemetry.io/docs/instrumentation/js/libraries/</a>

## 수집 (Collection)

### 메트릭 (Metrics)

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

### 트레이스 (Traces)

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

참고:

- <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">https://opentelemetry.io/docs/instrumentation/js/exporters</a>