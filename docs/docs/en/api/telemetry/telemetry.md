# Telemetry

## Overview

`Telemetry` is the telemetry module of NocoBase, encapsulating OpenTelemetry support for registering metrics and traces within the OpenTelemetry ecosystem.

## Class Methods

### `constructor()`

Constructor to create a `Telemetry` instance.

#### Signature

- `constructor(options?: TelemetryOptions)`

#### Type

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### Details

| Property      | Type            | Description                                                                                              | Default Value                      |
| ------------- | --------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `serviceName` | `string`        | Optional. Refer to [Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/resource/#service) | `nocobase`                         |
| `version`     | `string`        | Optional. Refer to [Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/resource/#service) | Optional, current NocoBase version |
| `trace`       | `TraceOptions`  | Optional. Refer to [Trace](./trace.md)                                                                   | -                                  |
| `metric`      | `MetricOptions` | Optional. Refer to [Metric](./metric.md)                                                                 | -                                  |

### `init()`

Registers instrumentation and initializes `Trace` and `Metric`.

#### Signature

- `init(): void`

### `start()`

Starts the processing of `Trace` and `Metric` related data, such as exporting to Prometheus.

#### Signature

- `start(): void`

### `shutdown()`

Stops the processing of `Trace` and `Metric` related data.

#### Signature

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Adds instrumentation libraries.

#### Signature

- `addInstrumentation(...instrumentation: InstrumentationOption[])`
