:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/api/telemetry/metric)
:::

# Metric

## เมธอดของคลาส (Class Methods)

### `constructor()`

คอนสตรักเตอร์สำหรับสร้างอินสแตนซ์ของ `Metric` ครับ

#### Signature

- `constructor(options?: MetricOptions)`

#### Type

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### รายละเอียด

| คุณสมบัติ | ประเภท | คำอธิบาย | ค่าเริ่มต้น |
| ------------ | ---------------------- | -------------------------------------- | ------------------- |
| `meterName` | `string` | ตัวระบุ (Identifier) ของ meter | `nocobase-meter` |
| `version` | `string` | | หมายเลขเวอร์ชันปัจจุบันของ NocoBase |
| `readerName` | `string` \| `string[]` | ตัวระบุของ `MetricReader` ที่ลงทะเบียนไว้ซึ่งต้องการเปิดใช้งาน | |

### `init()`

เริ่มต้นการทำงานของ `MetricProvider` ครับ

#### Signature

- `init(): void`

### `registerReader()`

ลงทะเบียน `MetricReader` ครับ

#### Signature

- `registerReader(name: string, reader: GetMetricReader)`

#### Type

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### รายละเอียด

| พารามิเตอร์ | ประเภท | คำอธิบาย |
| ----------- | -------------------- | -------------------------- |
| `name` | `string` | ตัวระบุเฉพาะ (Unique identifier) ของ `MetricReader` |
| `reader` | `() => MetricReader` | วิธีการสำหรับรับค่า `MetricReader` |

### `addView()`

เพิ่ม `View` อ้างอิงได้ที่ <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a> ครับ

#### Signature

- `addView(...view: View[])`

#### Type

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

รับค่า `Meter` ครับ

#### Signature

- `getMeter(name?: string, version?: string)`

#### รายละเอียด

| พารามิเตอร์ | ประเภท | คำอธิบาย | ค่าเริ่มต้น |
| --------- | -------- | ---------- | ------------------- |
| `name` | `string` | ตัวระบุ (Identifier) ของ meter | `nocobase-meter` |
| `version` | `string` | | หมายเลขเวอร์ชันปัจจุบันของ NocoBase |

### `start()`

เริ่มการทำงานของ `MetricReader` ครับ

#### Signature

- `start(): void`

### `shutdown()`

หยุดการทำงานของ `MetricReader` ครับ

#### Signature

- `shutdown(): Promise<void>`