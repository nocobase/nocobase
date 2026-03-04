:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/api/telemetry/trace).
:::

# Trace

## Phương thức lớp

### `constructor()`

Hàm khởi tạo, tạo một thực thể `Trace`.

#### Cấu trúc

- `constructor(options?: TraceOptions)`

#### Kiểu dữ liệu

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### Chi tiết

| Thuộc tính      | Kiểu dữ liệu           | Mô tả                                                   | Giá trị mặc định            |
| --------------- | ---------------------- | ------------------------------------------------------- | --------------------------- |
| `tracerName`    | `string`               | Định danh trace                                         | `nocobase-trace`            |
| `version`       | `string`               |                                                         | Phiên bản hiện tại của NocoBase |
| `processorName` | `string` \| `string[]` | Định danh của các `SpanProcessor` đã đăng ký muốn kích hoạt |                             |

### `init()`

Khởi tạo `NodeTracerProvider`.

#### Cấu trúc

- `init(): void`

### `registerProcessor()`

Đăng ký `SpanProcessor`.

#### Cấu trúc

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Kiểu dữ liệu

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Chi tiết

| Tham số     | Kiểu dữ liệu          | Mô tả                               |
| ----------- | --------------------- | ----------------------------------- |
| `name`      | `string`              | Định danh duy nhất cho `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Phương thức để lấy `SpanProcessor`  |

### `getTracer()`

Lấy `Tracer`.

#### Cấu trúc

- `getTracer(name?: string, version?: string)`

#### Chi tiết

| Tham số   | Kiểu dữ liệu | Mô tả           | Giá trị mặc định            |
| --------- | ------------ | --------------- | --------------------------- |
| `name`    | `string`     | Định danh trace | `nocobase-trace`            |
| `version` | `string`     |                 | Phiên bản hiện tại của NocoBase |

### `start()`

Khởi động `SpanProcessor`.

#### Cấu trúc

- `start(): void`

### `shutdown()`

Dừng `SpanProcessor`.

#### Cấu trúc

- `shutdown(): Promise<void>`