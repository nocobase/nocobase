:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# Telemetry

## نظرة عامة

`Telemetry` هي وحدة Telemetry في NocoBase، وهي تغلف <a href="https://opentelemetry.io">OpenTelemetry</a> وتدعم تسجيل أدوات المقاييس (Metric) والتتبع (Trace) ضمن بيئة OpenTelemetry.

## توابع الفئة

### `constructor()`

دالة بناء لإنشاء نسخة (instance) من `Telemetry`.

#### التوقيع

- `constructor(options?: TelemetryOptions)`

#### النوع

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### التفاصيل

| الخاصية        | النوع            | الوصف                                                                                                                        | القيمة الافتراضية                  |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `serviceName` | `string`        | اختياري. ارجع إلى <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                         |
| `version`     | `string`        | اختياري. ارجع إلى <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | اختياري، إصدار NocoBase الحالي |
| `trace`       | `TraceOptions`  | اختياري. ارجع إلى [Trace](./trace.md)                                                                                       | -                                  |
| `metric`      | `MetricOptions` | اختياري. ارجع إلى [Metric](./metric.md)                                                                                     | -                                  |

### `init()`

يسجل أدوات القياس (Instrumentation) ويهيئ `Trace` و `Metric`.

#### التوقيع

- `init(): void`

### `start()`

يبدأ معالجة البيانات المتعلقة بـ `Trace` و `Metric`، مثل التصدير إلى Prometheus.

#### التوقيع

- `start(): void`

### `shutdown()`

يوقف معالجة البيانات المتعلقة بـ `Trace` و `Metric`.

#### التوقيع

- `shutdown(): Promise<void>`

### `addInstrumentation()`

يضيف مكتبات أدوات القياس (instrumentation).

#### التوقيع

- `addInstrumentation(...instrumentation: InstrumentationOption[])`