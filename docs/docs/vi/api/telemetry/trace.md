---
title: "Trace"
description: "API tracing của NocoBase: phương thức của lớp Trace, distributed tracing."
keywords: "Trace,API tracing,distributed tracing,Telemetry,NocoBase"
---

# Trace

## Phương thức của lớp

### `constructor()`

Constructor, tạo một instance `Trace`.

#### Chữ ký

- `constructor(options?: TraceOptions)`

#### Kiểu

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### Thông tin chi tiết

| Thuộc tính      | Kiểu                   | Mô tả                                            | Giá trị mặc định           |
| --------------- | ---------------------- | ------------------------------------------------ | -------------------------- |
| `traceName`     | `string`               | Định danh trace                                  | `nocobase-trace`           |
| `version`       | `string`               |                                                  | Phiên bản NocoBase hiện tại |
| `processorName` | `string` \| `string[]` | Định danh của `SpanProcessor` đã đăng ký muốn bật |                            |

### `init()`

Khởi tạo `NodeTracerProvider`.

#### Chữ ký

- `init(): void`

### `registerProcessor()`

Đăng ký `SpanProcessor`.

#### Chữ ký

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Kiểu

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Thông tin chi tiết

| Tham số     | Kiểu                  | Mô tả                              |
| ----------- | --------------------- | ---------------------------------- |
| `name`      | `string`              | Định danh duy nhất của `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Phương thức lấy `SpanProcessor`     |

### `getTracer()`

Lấy `Tracer`.

#### Chữ ký

- `getTracer(name?: string, version?: string)`

#### Thông tin chi tiết

| Tham số   | Kiểu     | Mô tả          | Giá trị mặc định           |
| --------- | -------- | -------------- | -------------------------- |
| `name`    | `string` | Định danh trace | `nocobase-trace`           |
| `version` | `string` |                | Phiên bản NocoBase hiện tại |

### `start()`

Khởi động `SpanProcessor`.

#### Chữ ký

- `start(): void`

### `shutdown()`

Dừng `SpanProcessor`.

#### Chữ ký

- `shutdown(): Promise<void>`
