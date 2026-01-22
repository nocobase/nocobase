:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# Trace

## מתודות מחלקה

### `constructor()`

הקונסטרוקטור יוצר מופע (instance) של `Trace`.

#### חתימה

- `constructor(options?: TraceOptions)`

#### טיפוס

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### פרטים

| מאפיין          | טיפוס                  | תיאור                                   | ערך ברירת מחדל              |
| --------------- | ---------------------- | --------------------------------------- | --------------------------- |
| `tracerName`    | `string`               | מזהה Trace                              | `nocobase-trace`            |
| `version`       | `string`               |                                         | הגרסה הנוכחית של NocoBase |
| `processorName` | `string` \| `string[]` | מזהה/ים של `SpanProcessor` רשום/ים לשימוש | -                           |

### `init()`

מאתחל את `NodeTracerProvider`.

#### חתימה

- `init(): void`

### `registerProcessor()`

רושם `SpanProcessor`.

#### חתימה

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### טיפוס

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### פרטים

| פרמטר       | טיפוס                 | תיאור                             |
| ----------- | --------------------- | --------------------------------- |
| `name`      | `string`              | מזהה ייחודי עבור `SpanProcessor` |
| `processor` | `() => SpanProcessor` | פונקציה לקבלת `SpanProcessor`    |

### `getTracer()`

מקבל את ה-`Tracer`.

#### חתימה

- `getTracer(name?: string, version?: string)`

#### פרטים

| פרמטר     | טיפוס    | תיאור        | ערך ברירת מחדל              |
| --------- | -------- | ------------ | --------------------------- |
| `name`    | `string` | מזהה Trace   | `nocobase-trace`            |
| `version` | `string` |              | הגרסה הנוכחית של NocoBase |

### `start()`

מפעיל את ה-`SpanProcessor`.

#### חתימה

- `start(): void`

### `shutdown()`

מפסיק את ה-`SpanProcessor`.

#### חתימה

- `shutdown(): Promise<void>`