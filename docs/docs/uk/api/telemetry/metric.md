:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/api/telemetry/metric).
:::

# Metric

## Методи класу

### `constructor()`

Конструктор для створення екземпляра `Metric`.

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

#### Деталі

| Властивість  | Тип                    | Опис                                                  | Значення за замовчуванням |
| ------------ | ---------------------- | ----------------------------------------------------- | ------------------------- |
| `meterName`  | `string`               | Ідентифікатор meter                                   | `nocobase-meter`          |
| `version`    | `string`               |                                                       | Поточна версія NocoBase   |
| `readerName` | `string` \| `string[]` | Ідентифікатор(и) зареєстрованих `MetricReader` для використання |                           |

### `init()`

Ініціалізує `MetricProvider`.

#### Сигнатура

- `init(): void`

### `registerReader()`

Реєструє `MetricReader`.

#### Сигнатура

- `registerReader(name: string, reader: GetMetricReader)`

#### Тип

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Деталі

| Параметр | Тип                  | Опис                                     |
| -------- | -------------------- | ---------------------------------------- |
| `name`   | `string`             | Унікальний ідентифікатор для `MetricReader` |
| `reader` | `() => MetricReader` | Функція для отримання `MetricReader`     |

### `addView()`

Додає `View`. Дивіться <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>.

#### Сигнатура

- `addView(...view: View[])`

#### Тип

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Отримує `Meter`.

#### Сигнатура

- `getMeter(name?: string, version?: string)`

#### Деталі

| Параметр  | Тип      | Опис                | Значення за замовчуванням |
| --------- | -------- | ------------------- | ------------------------- |
| `name`    | `string` | Ідентифікатор meter | `nocobase-meter`          |
| `version` | `string` |                     | Поточна версія NocoBase   |

### `start()`

Запускає `MetricReader`.

#### Сигнатура

- `start(): void`

### `shutdown()`

Зупиняє `MetricReader`.

#### Сигнатура

- `shutdown(): Promise<void>`