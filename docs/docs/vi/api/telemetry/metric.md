:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/api/telemetry/metric).
:::

# Metric

## Các phương thức của lớp

### `constructor()`

Hàm khởi tạo, tạo một thực thể `Metric`.

#### Chữ ký

- `constructor(options?: MetricOptions)`

#### Kiểu dữ liệu

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Chi tiết

| Thuộc tính   | Kiểu dữ liệu           | Mô tả                                          | Giá trị mặc định           |
| ------------ | ---------------------- | ---------------------------------------------- | -------------------------- |
| `meterName`  | `string`               | Định danh meter                                | `nocobase-meter`           |
| `version`    | `string`               |                                                | Phiên bản hiện tại của NocoBase |
| `readerName` | `string` \| `string[]` | Định danh của `MetricReader` đã đăng ký muốn kích hoạt |                            |

### `init()`

Khởi tạo `MetricProvider`.

#### Chữ ký

- `init(): void`

### `registerReader()`

Đăng ký `MetricReader`.

#### Chữ ký

- `registerReader(name: string, reader: GetMetricReader)`

#### Kiểu dữ liệu

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Chi tiết

| Tham số     | Kiểu dữ liệu         | Mô tả                               |
| ----------- | -------------------- | ----------------------------------- |
| `name`      | `string`             | Định danh duy nhất cho `MetricReader` |
| `reader`    | `() => MetricReader` | Phương thức để lấy `MetricReader`   |

### `addView()`

Thêm `View`. Tham khảo <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>.

#### Chữ ký

- `addView(...view: View[])`

#### Kiểu dữ liệu

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Lấy `Meter`.

#### Chữ ký

- `getMeter(name?: string, version?: string)`

#### Chi tiết

| Tham số   | Kiểu dữ liệu | Mô tả           | Giá trị mặc định           |
| --------- | ------------ | --------------- | -------------------------- |
| `name`    | `string`     | Định danh meter | `nocobase-meter`           |
| `version` | `string`     |                 | Phiên bản hiện tại của NocoBase |

### `start()`

Khởi động `MetricReader`.

#### Chữ ký

- `start(): void`

### `shutdown()`

Dừng `MetricReader`.

#### Chữ ký

- `shutdown(): Promise<void>`