:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/api/telemetry/telemetry).
:::

# Телеметрія (Telemetry)

## Огляд

`Telemetry` — це модуль телеметрії NocoBase, побудований на базі <a href="https://opentelemetry.io">OpenTelemetry</a>. Він підтримує реєстрацію інструментів метрик (Metric) та трасування (Trace) в екосистемі OpenTelemetry.

## Методи класу

### `constructor()`

Конструктор для створення екземпляра `Telemetry`.

#### Сигнатура

- `constructor(options?: TelemetryOptions)`

#### Тип

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### Деталі

| Властивість   | Тип             | Опис                                                                                                                        | Значення за замовчуванням  |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | Опціонально. Див. <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                 |
| `version`     | `string`        | Опціонально. Див. <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Опціонально, поточна версія NocoBase |
| `trace`       | `TraceOptions`  | Опціонально. Див. [Trace](./trace.md)                                                                                              | -                          |
| `metric`      | `MetricOptions` | Опціонально. Див. [Metric](./metric.md)                                                                                            | -                          |

### `init()`

Реєструє інструментарій (Instrumentation), ініціалізує `Trace` та `Metric`.

#### Сигнатура

- `init(): void`

### `start()`

Запускає обробники даних, пов'язаних із `Trace` та `Metric`, наприклад: експорт у Prometheus.

#### Сигнатура

- `start(): void`

### `shutdown()`

Зупиняє обробники даних, пов'язаних із `Trace` та `Metric`.

#### Сигнатура

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Додає бібліотеки інструментарію.

#### Сигнатура

- `addInstrumentation(...instrumentation: InstrumentationOption[])`