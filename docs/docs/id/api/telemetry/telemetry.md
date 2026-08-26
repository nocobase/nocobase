---
title: "Telemetry"
description: "API observability NocoBase: Telemetry untuk telemetri, metric, trace."
keywords: "Telemetry,observability,telemetri,metric,trace,Metric,Trace,NocoBase"
---

# Telemetry

## Ikhtisar

`Telemetry` adalah modul telemetri NocoBase, di-wrap berdasarkan <a href="https://opentelemetry.io">OpenTelemetry</a>, mendukung pendaftaran tools metric dan trace dari ekosistem OpenTelemetry.

## Method Class

### `constructor()`

Constructor, membuat instance `Telemetry`.

#### Signature

- `constructor(options?: TelemetryOptions)`

#### Tipe

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### Detail

| Properti | Tipe | Deskripsi | Default |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string` | Opsional, lihat <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase` |
| `version` | `string` | Opsional, lihat <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Opsional, nomor versi NocoBase saat ini |
| `trace` | `TraceOptions` | Opsional, lihat [Trace](./trace.md) |
| `metric` | `MetricOptions` | Opsional, lihat [Metric](./metric.md) |

### `init()`

Mendaftarkan Instrumention, menginisialisasi `Trace`, `Metric`.

#### Signature

- `init(): void`

### `start()`

Memulai program pemroses data terkait `Trace`, `Metric`, seperti: export ke Prometheus.

#### Signature

- `start(): void`

### `shutdown()`

Menghentikan program pemroses data terkait `Trace`, `Metric`.

#### Signature

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Menambahkan tools library instrumentation

#### Signature

- `addInstrumentation(...instrumentation: InstrumentationOption[])`
