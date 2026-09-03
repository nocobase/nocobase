# Trace

## Методы класса

### `constructor()`

Конструктор для создания экземпляра `Trace`.

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

#### Подробности

| Свойство        | Тип                    | Описание                                                  | Значение по умолчанию   |
| --------------- | ---------------------- | --------------------------------------------------------- | ----------------------- |
| `tracerName`    | `string`               | Идентификатор Trace                                       | `nocobase-trace`        |
| `version`       | `string`               |                                                           | Текущая версия NocoBase |
| `processorName` | `string` \| `string[]` | Идентификатор(ы) зарегистрированного `SpanProcessor`     | -                       |

### `init()`

Инициализирует `NodeTracerProvider`.

#### Сигнатура

- `init(): void`

### `registerProcessor()`

Регистрирует `SpanProcessor`.

#### Сигнатура

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Тип

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Подробности

| Параметр    | Тип                   | Описание                                   |
| ----------- | --------------------- | ------------------------------------------ |
| `name`      | `string`              | Уникальный идентификатор `SpanProcessor`   |
| `processor` | `() => SpanProcessor` | Функция для получения `SpanProcessor`      |

### `getTracer()`

Возвращает `Tracer`.

#### Сигнатура

- `getTracer(name?: string, version?: string)`

#### Подробности

| Параметр  | Тип      | Описание             | Значение по умолчанию   |
| --------- | -------- | -------------------- | ----------------------- |
| `name`    | `string` | Идентификатор Trace  | `nocobase-trace`        |
| `version` | `string` |                      | Текущая версия NocoBase |

### `start()`

Запускает `SpanProcessor`.

#### Сигнатура

- `start(): void`

### `shutdown()`

Останавливает `SpanProcessor`.

#### Сигнатура

- `shutdown(): Promise<void>`