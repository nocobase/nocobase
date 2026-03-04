:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/api/telemetry/trace).
:::

# Trace

## Методи класу

### `constructor()`

Конструктор для створення екземпляра `Trace`.

#### Сигнатура

- `constructor(options?: TraceOptions)`

#### Тип

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### Деталі

| Властивість     | Тип                    | Опис                                                  | Значення за замовчуванням |
| --------------- | ---------------------- | ----------------------------------------------------- | ------------------------- |
| `tracerName`    | `string`               | Ідентифікатор трасування                              | `nocobase-trace`          |
| `version`       | `string`               |                                                       | Поточна версія NocoBase   |
| `processorName` | `string` \| `string[]` | Ідентифікатор(и) зареєстрованих `SpanProcessor` для використання |                           |

### `init()`

Ініціалізує `NodeTracerProvider`.

#### Сигнатура

- `init(): void`

### `registerProcessor()`

Реєструє `SpanProcessor`.

#### Сигнатура

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Тип

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Деталі

| Параметр    | Тип                   | Опис                                |
| ----------- | --------------------- | ----------------------------------- |
| `name`      | `string`              | Унікальний ідентифікатор `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Метод для отримання `SpanProcessor` |

### `getTracer()`

Отримує `Tracer`.

#### Сигнатура

- `getTracer(name?: string, version?: string)`

#### Деталі

| Параметр  | Тип      | Опис                     | Значення за замовчуванням |
| --------- | -------- | ------------------------ | ------------------------- |
| `name`    | `string` | Ідентифікатор трасування | `nocobase-trace`          |
| `version` | `string` |                          | Поточна версія NocoBase   |

### `start()`

Запускає `SpanProcessor`.

#### Сигнатура

- `start(): void`

### `shutdown()`

Зупиняє `SpanProcessor`.

#### Сигнатура

- `shutdown(): Promise<void>`