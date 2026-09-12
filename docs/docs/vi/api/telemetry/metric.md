---
title: "Metric"
description: "API metric của NocoBase: phương thức của lớp Metric, ghi nhận chỉ số."
keywords: "Metric,API metric,ghi nhận chỉ số,Telemetry,NocoBase"
---

# Metric

## Phương thức của lớp

### `constructor()`

Constructor, tạo một instance `Metric`.

#### Chữ ký

- `constructor(options?: MetricOptions)`

#### Kiểu

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Thông tin chi tiết

| Thuộc tính   | Kiểu                   | Mô tả                                            | Giá trị mặc định           |
| ------------ | ---------------------- | ------------------------------------------------ | -------------------------- |
| `meterName`  | `string`               | Định danh meter                                  | `nocobase-meter`           |
| `version`    | `string`               |                                                  | Phiên bản NocoBase hiện tại |
| `readerName` | `string` \| `string[]` | Định danh của `MetricReader` đã đăng ký muốn bật |                            |

### `init()`

Khởi tạo `MetricProvider`.

#### Chữ ký

- `init(): void`

### `registerReader()`

Đăng ký `MetricReader`.

#### Chữ ký

- `registerReader(name: string, reader: GetMetricReader)`

#### Kiểu

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Thông tin chi tiết

| Tham số     | Kiểu                 | Mô tả                             |
| ----------- | -------------------- | --------------------------------- |
| `name`      | `string`             | Định danh duy nhất của `MetricReader` |
| `processor` | `() => MetricReader` | Phương thức lấy `MetricReader`    |

### `addView()`

Thêm `View`. Tham khảo <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>.

#### Chữ ký

- `addView(...view: View[])`

#### Kiểu

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Lấy `Meter`.

#### Chữ ký

- `getMeter(name?: string, version?: string)`

#### Thông tin chi tiết

| Tham số   | Kiểu     | Mô tả          | Giá trị mặc định           |
| --------- | -------- | -------------- | -------------------------- |
| `name`    | `string` | Định danh meter | `nocobase-meter`           |
| `version` | `string` |                | Phiên bản NocoBase hiện tại |

### `start()`

Khởi động `MetricReader`.

#### Chữ ký

- `start(): void`

### `shutdown()`

Dừng `MetricReader`.

#### Chữ ký

- `shutdown(): Promise<void>`
