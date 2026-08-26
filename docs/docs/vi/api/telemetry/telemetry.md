---
title: "Telemetry"
description: "API observability của NocoBase: Telemetry, metric, trace."
keywords: "Telemetry,observability,telemetry,metric,trace,Metric,Trace,NocoBase"
---

# Telemetry

## Tổng quan

`Telemetry` là module telemetry của NocoBase, được đóng gói trên nền <a href="https://opentelemetry.io">OpenTelemetry</a>, hỗ trợ đăng ký các công cụ Metric và Trace trong hệ sinh thái OpenTelemetry.

## Phương thức của lớp

### `constructor()`

Constructor, tạo một instance `Telemetry`.

#### Chữ ký

- `constructor(options?: TelemetryOptions)`

#### Kiểu

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### Thông tin chi tiết

| Thuộc tính    | Kiểu            | Mô tả                                                                                                                       | Giá trị mặc định                |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `serviceName` | `string`        | Tùy chọn, tham khảo <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                      |
| `version`     | `string`        | Tùy chọn, tham khảo <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Tùy chọn, phiên bản NocoBase hiện tại |
| `trace`       | `TraceOptions`  | Tùy chọn, tham khảo [Trace](./trace.md)                                                                                     |
| `metric`      | `MetricOptions` | Tùy chọn, tham khảo [Metric](./metric.md)                                                                                   |

### `init()`

Đăng ký Instrumention, khởi tạo `Trace`, `Metric`.

#### Chữ ký

- `init(): void`

### `start()`

Khởi động chương trình xử lý dữ liệu liên quan đến `Trace`, `Metric`, ví dụ: xuất sang Prometheus.

#### Chữ ký

- `start(): void`

### `shutdown()`

Dừng các chương trình xử lý dữ liệu liên quan đến `Trace`, `Metric`.

#### Chữ ký

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Thêm thư viện công cụ instrumentation.

#### Chữ ký

- `addInstrumentation(...instrumentation: InstrumentationOption[])`
