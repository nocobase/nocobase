# Metric

## Методы класса

### `constructor()`

Конструктор для создания экземпляра `Metric`.

#### Сигнатура

- `constructor(options?: MetricOptions)`

#### Тип

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Подробности

| Свойство     | Тип                    | Описание                                                | Значение по умолчанию       |
| ------------ | ---------------------- | ------------------------------------------------------- | --------------------------- |
| `meterName`  | `string`               | Идентификатор Meter                                     | `nocobase-meter`            |
| `version`    | `string`               |                                                         | Текущая версия NocoBase     |
| `readerName` | `string` \| `string[]` | Идентификатор(ы) зарегистрированного `MetricReader`    | -                           |

### `init()`

Инициализирует `MetricProvider`.

#### Сигнатура

- `init(): void`

### `registerReader()`

Регистрирует `MetricReader`.

#### Сигнатура

- `registerReader(name: string, reader: GetMetricReader)`

#### Тип

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Подробности

| Параметр | Тип                  | Описание                                  |
| -------- | -------------------- | ----------------------------------------- |
| `name`   | `string`             | Уникальный идентификатор `MetricReader`   |
| `reader` | `() => MetricReader` | Функция для получения `MetricReader`      |

### `addView()`

Добавляет `View`. См. [Configure Metric Views](https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views).

#### Сигнатура

- `addView(...view: View[])`

#### Тип

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Возвращает `Meter`.

#### Сигнатура

- `getMeter(name?: string, version?: string)`

#### Подробности

| Параметр  | Тип      | Описание             | Значение по умолчанию   |
| --------- | -------- | -------------------- | ----------------------- |
| `name`    | `string` | Идентификатор Meter  | `nocobase-meter`        |
| `version` | `string` |                      | Текущая версия NocoBase |

### `start()`

Запускает `MetricReader`.

#### Сигнатура

- `start(): void`

### `shutdown()`

Останавливает `MetricReader`.

#### Сигнатура

- `shutdown(): Promise<void>`