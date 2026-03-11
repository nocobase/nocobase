:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/api/telemetry/telemetry).
:::

# Telemetry

## Tổng quan

`Telemetry` là mô-đun đo lường từ xa của NocoBase, được đóng gói dựa trên <a href="https://opentelemetry.io">OpenTelemetry</a>, hỗ trợ đăng ký các công cụ chỉ số (Metric) và dấu vết (Trace) trong hệ sinh thái OpenTelemetry.

## Phương thức lớp

### `constructor()`

Hàm khởi tạo, tạo một thực thể `Telemetry`.

#### Chữ ký (Signature)

- `constructor(options?: TelemetryOptions)`

#### Kiểu dữ liệu (Type)

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### Thông tin chi tiết

| Thuộc tính    | Kiểu            | Mô tả                                                                                                                       | Giá trị mặc định           |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | Tùy chọn, tham khảo <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                 |
| `version`     | `string`        | Tùy chọn, tham khảo <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Tùy chọn, số phiên bản NocoBase hiện tại |
| `trace`       | `TraceOptions`  | Tùy chọn, tham khảo [Trace](./trace.md)                                                                                              | -                          |
| `metric`      | `MetricOptions` | Tùy chọn, tham khảo [Metric](./metric.md)                                                                                            | -                          |

### `init()`

Đăng ký Instrumentation, khởi tạo `Trace` và `Metric`.

#### Chữ ký (Signature)

- `init(): void`

### `start()`

Bắt đầu các trình xử lý dữ liệu liên quan đến `Trace` và `Metric`, ví dụ: xuất dữ liệu sang Prometheus.

#### Chữ ký (Signature)

- `start(): void`

### `shutdown()`

Dừng các trình xử lý dữ liệu liên quan đến `Trace` và `Metric`.

#### Chữ ký (Signature)

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Thêm các thư viện công cụ đo kiểm (instrumentation).

#### Chữ ký (Signature)

- `addInstrumentation(...instrumentation: InstrumentationOption[])`