# Telemetry

## 概览

`Telemetry` 是 NocoBase 的遥测模块，基于 <a href="https://opentelemetry.io">OpenTelemetry</a> 封装，支持注册 OpenTelemetry 生态的指标 (Metric) 和链路 (Trace) 工具。

## 类方法

### `constructor()`

构造函数，创建一个 `Telemetry` 实例。

#### 签名

- `constructor(options?: TelemetryOptions)`

#### 类型

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### 详细信息

| 属性          | 类型            | 描述                                                                                                                        | 默认值                     |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | 可选，参考 <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                 |
| `version`     | `string`        | 可选，参考 <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | 可选，当前 NocoBase 版本号 |
| `trace`       | `TraceOptions`  | 可选，参考 [Trace](./trace.md)                                                                                              |
| `metric`      | `MetricOptions` | 可选，参考 [Metric](./metric.md)                                                                                            |

### `init()`

注册 Instrumention, 初始化 `Trace`, `Metric`.

#### 签名

- `init(): void`

### `start()`

启动 `Trace`, `Metric` 相关数据的处理程序，如：导出到 Prometheus.

#### 签名

- `start(): void`

### `shutdown()`

停止 `Trace`, `Metric` 相关的数据处理程序。

#### 签名

- `shutdown(): Promise<void>`

### `addInstrumentation()`

添加插桩工具库

#### 签名

- `addInstrumentation(...instrumentation: InstrumentationOption[])`
