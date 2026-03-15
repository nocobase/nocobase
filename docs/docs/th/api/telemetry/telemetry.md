:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/api/telemetry/telemetry)
:::

# Telemetry

## ภาพรวม

`Telemetry` คือโมดูลการวัดระยะไกล (Telemetry) ของ NocoBase ซึ่งพัฒนาขึ้นโดยครอบ (Encapsulate) <a href="https://opentelemetry.io">OpenTelemetry</a> เอาไว้ รองรับการลงทะเบียนเครื่องมือสำหรับตัวชี้วัด (Metric) และการติดตามเส้นทาง (Trace) ภายในระบบนิเวศของ OpenTelemetry ครับ

## เมธอดของคลาส (Class Methods)

### `constructor()`

คอนสตรัคเตอร์สำหรับสร้างอินสแตนซ์ของ `Telemetry` ครับ

#### Signature

- `constructor(options?: TelemetryOptions)`

#### ประเภท (Type)

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### รายละเอียด

| คุณสมบัติ | ประเภท | คำอธิบาย | ค่าเริ่มต้น |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | ตัวเลือกเสริม อ้างอิง <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                 |
| `version`     | `string`        | ตัวเลือกเสริม อ้างอิง <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | ตัวเลือกเสริม เป็นหมายเลขเวอร์ชันปัจจุบันของ NocoBase |
| `trace`       | `TraceOptions`  | ตัวเลือกเสริม อ้างอิง [Trace](./trace.md) | |
| `metric`      | `MetricOptions` | ตัวเลือกเสริม อ้างอิง [Metric](./metric.md) | |

### `init()`

ลงทะเบียน Instrumentation และเริ่มต้นการทำงาน (Initialize) `Trace` และ `Metric` ครับ

#### Signature

- `init(): void`

### `start()`

เริ่มต้นโปรแกรมประมวลผลข้อมูลที่เกี่ยวข้องกับ `Trace` และ `Metric` เช่น การส่งออกข้อมูลไปยัง Prometheus ครับ

#### Signature

- `start(): void`

### `shutdown()`

หยุดการทำงานของโปรแกรมประมวลผลข้อมูลที่เกี่ยวข้องกับ `Trace` และ `Metric` ครับ

#### Signature

- `shutdown(): Promise<void>`

### `addInstrumentation()`

เพิ่มไลบรารีเครื่องมือ Instrumentation

#### Signature

- `addInstrumentation(...instrumentation: InstrumentationOption[])`