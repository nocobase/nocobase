:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# التتبع

## طرق الفئة

### الدالة البانية (constructor())

الدالة البانية لإنشاء كائن (instance) من `Trace`.

#### التوقيع

- `constructor(options?: TraceOptions)`

#### النوع

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### التفاصيل

| الخاصية        | النوع                   | الوصف                                            | القيمة الافتراضية          |
| --------------- | ---------------------- | ------------------------------------------------ | -------------------------- |
| `tracerName`    | `string`               | مُعرّف التتبع                                    | `nocobase-trace`           |
| `version`       | `string`               |                                                  | الإصدار الحالي لـ NocoBase |
| `processorName` | `string` \| `string[]` | مُعرّف (أو مُعرّفات) `SpanProcessor` المسجّلة المراد استخدامها | -                          |

### `init()`

يهيئ `NodeTracerProvider`.

#### التوقيع

- `init(): void`

### `registerProcessor()`

يسجل `SpanProcessor`.

#### التوقيع

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### النوع

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### التفاصيل

| المعامل     | النوع                  | الوصف                                 |
| ----------- | --------------------- | ------------------------------------- |
| `name`      | `string`              | مُعرّف فريد لـ `SpanProcessor`        |
| `processor` | `() => SpanProcessor` | دالة للحصول على `SpanProcessor`       |

### `getTracer()`

يحصل على `Tracer`.

#### التوقيع

- `getTracer(name?: string, version?: string)`

#### التفاصيل

| المعامل   | النوع     | الوصف            | القيمة الافتراضية          |
| --------- | -------- | ---------------- | -------------------------- |
| `name`    | `string` | مُعرّف التتبع    | `nocobase-trace`           |
| `version` | `string` |                  | الإصدار الحالي لـ NocoBase |

### `start()`

يبدأ تشغيل `SpanProcessor`.

#### التوقيع

- `start(): void`

### `shutdown()`

يوقف `SpanProcessor`.

#### التوقيع

- `shutdown(): Promise<void>`