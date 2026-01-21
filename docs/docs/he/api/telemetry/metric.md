:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# מדד

## מתודות מחלקה

### `constructor()`

קונסטרוקטור ליצירת מופע של `Metric`.

#### חתימה

- `constructor(options?: MetricOptions)`

#### טיפוס

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### פרטים

| מאפיין       | טיפוס                 | תיאור                                   | ערך ברירת מחדל          |
| ------------ | ---------------------- | --------------------------------------- | ----------------------- |
| `meterName`  | `string`               | מזהה Meter                              | `nocobase-meter`        |
| `version`    | `string`               |                                         | גרסה נוכחית של NocoBase |
| `readerName` | `string` \| `string[]` | מזהה/ים של `MetricReader` רשום/ים לשימוש | -                       |

### `init()`

מאתחל את `MetricProvider`.

#### חתימה

- `init(): void`

### `registerReader()`

רושם `MetricReader`.

#### חתימה

- `registerReader(name: string, reader: GetMetricReader)`

#### טיפוס

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### פרטים

| פרמטר    | טיפוס                | תיאור                          |
| -------- | -------------------- | ------------------------------ |
| `name`   | `string`             | מזהה ייחודי עבור `MetricReader` |
| `reader` | `() => MetricReader` | פונקציה לקבלת `MetricReader`   |

### `addView()`

מוסיף `View`. עיינו ב-[Configure Metric Views](https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views).

#### חתימה

- `addView(...view: View[])`

#### טיפוס

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

מקבל את ה-`Meter`.

#### חתימה

- `getMeter(name?: string, version?: string)`

#### פרטים

| פרמטר   | טיפוס    | תיאור      | ערך ברירת מחדל          |
| ------- | -------- | ---------- | ----------------------- |
| `name`  | `string` | מזהה Meter | `nocobase-meter`        |
| `version` | `string` |            | גרסה נוכחית של NocoBase |

### `start()`

מפעיל את ה-`MetricReader`.

#### חתימה

- `start(): void`

### `shutdown()`

עוצר את ה-`MetricReader`.

#### חתימה

- `shutdown(): Promise<void>`