:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# المقياس

## طرق الفئة

### `الدالة الإنشائية()`

الدالة الإنشائية التي تنشئ كائنًا (instance) من `Metric`.

#### التوقيع

- `constructor(options?: MetricOptions)`

#### النوع

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### التفاصيل

| الخاصية     | النوع                   | الوصف                                   | القيمة الافتراضية          |
| ------------ | ---------------------- | --------------------------------------- | --------------------------- |
| `meterName`  | `string`               | معرف المقياس                            | `nocobase-meter`            |
| `version`    | `string`               |                                         | الإصدار الحالي لـ NocoBase |
| `readerName` | `string` \| `string[]` | معرف (أو معرفات) `MetricReader` المسجلة المراد استخدامها |                     |

### `تهيئة()`

تهيئة `MetricProvider`.

#### التوقيع

- `init(): void`

### `تسجيل القارئ()`

يسجل `MetricReader`.

#### التوقيع

- `registerReader(name: string, reader: GetMetricReader)`

#### النوع

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### التفاصيل

| المُعامل | النوع                 | الوصف                       |
| --------- | -------------------- | --------------------------- |
| `name`    | `string`             | معرف فريد لـ `MetricReader` |
| `reader`  | `() => MetricReader` | دالة للحصول على `MetricReader` |

### `إضافة عرض()`

يضيف `View`. راجع [تكوين طرق عرض المقاييس](https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views).

#### التوقيع

- `addView(...view: View[])`

#### النوع

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `الحصول على المقياس()`

يحصل على `Meter`.

#### التوقيع

- `getMeter(name?: string, version?: string)`

#### التفاصيل

| المُعامل  | النوع     | الوصف       | القيمة الافتراضية          |
| --------- | -------- | ----------- | --------------------------- |
| `name`    | `string` | معرف المقياس | `nocobase-meter`            |
| `version` | `string` |             | الإصدار الحالي لـ NocoBase |

### `بدء التشغيل()`

يبدأ تشغيل `MetricReader`.

#### التوقيع

- `start(): void`

### `إيقاف التشغيل()`

يوقف تشغيل `MetricReader`.

#### التوقيع

- `shutdown(): Promise<void>`