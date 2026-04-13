---
title: "Telemetry 遥测"
description: "NocoBase 服务端遥测：指标、追踪、可观测性、Telemetry API。"
keywords: "Telemetry,遥测,指标,追踪,可观测性,NocoBase"
---

# Telemetry 遥测

:::warning 注意

该功能目前为实验性功能。

:::

NocoBase 的遥测（Telemetry）模块基于 <a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a> 封装，用于收集链路（Trace）和监控指标（Metric）数据，增强 NocoBase 的可观测性（Observability）。

## 插桩

### 指标

```ts
const meter = app.telemetry.metric.getMeter();
const counter = meter.createCounter('event_counter', {});
counter.add(1);
```

详细用法见 <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-meter" target="_blank">OpenTelemetry - Acquiring a Meter</a>。

### 链路

```ts
const tracer = app.telemetry.trace.getTracer();
tracer.startActiveSpan();
tracer.startSpan();
```

详细用法见 <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#acquiring-a-tracer" target="_blank">OpenTelemetry - Acquiring a Tracer</a>。

### 工具库

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

:::warning 注意

NocoBase 中遥测模块的初始化位置为 `app.beforeLoad`，因此并不是所有插桩库都适用于 NocoBase。
比如 <a href="https://www.npmjs.com/package/@opentelemetry/instrumentation-koa" target="_blank">instrumentation-koa</a> 需要在 `Koa` 实例化之前引入，而 NocoBase 的 `Application` 虽然基于 `Koa`，但遥测模块是在 `Application` 实例化之后才初始化的，所以无法使用。

:::

详细用法见 <a href="https://opentelemetry.io/docs/instrumentation/js/libraries/" target="_blank">OpenTelemetry - Libraries</a>。

## 采集

### 指标

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

### 链路

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

详细用法见 <a href="https://opentelemetry.io/docs/instrumentation/js/exporters" target="_blank">OpenTelemetry - Exporters</a>。

## 相关链接

- [Logger 日志](./logger.md) — 日志与遥测配合使用，完善可观测性方案
- [Plugin 插件](./plugin.md) — 在插件中注册遥测插桩和采集器
- [服务端开发概述](./index.md) — 遥测模块在服务端架构中的位置
- [Event 事件](./event.md) — 通过事件机制在 `beforeLoad` 中初始化遥测
- [Middleware 中间件](./middleware.md) — 在中间件中结合遥测追踪请求链路
