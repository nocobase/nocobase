:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/api/telemetry/trace)
:::

# Trace

## เมธอดของคลาส

### `constructor()`

คอนสตรัคเตอร์ (Constructor) สำหรับสร้างอินสแตนซ์ของ `Trace` ครับ

#### Signature

- `constructor(options?: TraceOptions)`

#### Type

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### รายละเอียด

| คุณสมบัติ | ประเภท | คำอธิบาย | ค่าเริ่มต้น |
| --------------- | ---------------------- | --------------------------------------- | ------------------- |
| `tracerName` | `string` | ตัวระบุ (Identifier) ของ Trace | `nocobase-trace` |
| `version` | `string` | | เวอร์ชันปัจจุบันของ NocoBase |
| `processorName` | `string` \| `string[]` | ตัวระบุของ `SpanProcessor` ที่ลงทะเบียนไว้และต้องการเปิดใช้งาน | |

### `init()`

เริ่มต้นการทำงาน (Initialize) ของ `NodeTracerProvider` ครับ

#### Signature

- `init(): void`

### `registerProcessor()`

ลงทะเบียน `SpanProcessor` ครับ

#### Signature

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Type

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### รายละเอียด

| พารามิเตอร์ | ประเภท | คำอธิบาย |
| ----------- | --------------------- | --------------------------- |
| `name` | `string` | ตัวระบุเฉพาะ (Unique identifier) สำหรับ `SpanProcessor` |
| `processor` | `() => SpanProcessor` | เมธอดสำหรับรับค่า `SpanProcessor` |

### `getTracer()`

รับค่า `Tracer` ครับ

#### Signature

- `getTracer(name?: string, version?: string)`

#### รายละเอียด

| พารามิเตอร์ | ประเภท | คำอธิบาย | ค่าเริ่มต้น |
| --------- | -------- | ---------- | ------------------- |
| `name` | `string` | ตัวระบุของ Trace | `nocobase-trace` |
| `version` | `string` | | เวอร์ชันปัจจุบันของ NocoBase |

### `start()`

เริ่มต้นการทำงานของ `SpanProcessor` ครับ

#### Signature

- `start(): void`

### `shutdown()`

หยุดการทำงานของ `SpanProcessor` ครับ

#### Signature

- `shutdown(): Promise<void>`