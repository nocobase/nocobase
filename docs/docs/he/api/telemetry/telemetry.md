:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# טלמטריה

## סקירה כללית

`Telemetry` הוא מודול הטלמטריה של NocoBase, המבוסס על <a href="https://opentelemetry.io">OpenTelemetry</a> ותומך ברישום מדדים (Metric) ועקבות (Trace) בסביבת OpenTelemetry.

## מתודות מחלקה

### `constructor()`

הבונה יוצר מופע (instance) של `Telemetry`.

#### חתימה

- `constructor(options?: TelemetryOptions)`

#### טיפוס

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### פרטים

| מאפיין         | טיפוס           | תיאור                                                                                                                       | ערך ברירת מחדל            |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `serviceName` | `string`        | אופציונלי. עיין ב[מוסכמות סמנטיות](https://opentelemetry.io/docs/specs/semconv/resource/#service)                               | `nocobase`                |
| `version`     | `string`        | אופציונלי. עיין ב[מוסכמות סמנטיות](https://opentelemetry.io/docs/specs/semconv/resource/#service)                               | אופציונלי, גרסת NocoBase הנוכחית |
| `trace`       | `TraceOptions`  | אופציונלי. עיין ב[Trace](./trace.md)                                                                                             | -                         |
| `metric`      | `MetricOptions` | אופציונלי. עיין ב[Metric](./metric.md)                                                                                           | -                         |

### `init()`

רושם את ה-instrumentation ומאתחל את `Trace` ו-`Metric`.

#### חתימה

- `init(): void`

### `start()`

מפעיל את תהליך הטיפול בנתונים הקשורים ל-`Trace` ול-`Metric`, כגון ייצוא ל-Prometheus.

#### חתימה

- `start(): void`

### `shutdown()`

מפסיק את תהליך הטיפול בנתונים הקשורים ל-`Trace` ול-`Metric`.

#### חתימה

- `shutdown(): Promise<void>`

### `addInstrumentation()`

מוסיף ספריות instrumentation.

#### חתימה

- `addInstrumentation(...instrumentation: InstrumentationOption[])`