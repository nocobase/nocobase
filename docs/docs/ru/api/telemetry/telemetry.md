:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/api/telemetry/telemetry).
:::

# Telemetry

## Обзор

`Telemetry` — это модуль телеметрии NocoBase, построенный на базе <a href="https://opentelemetry.io">OpenTelemetry</a>. Он поддерживает регистрацию инструментов для метрик (Metric) и трассировок (Trace) в экосистеме OpenTelemetry.

## Методы класса

### `constructor()`

Конструктор для создания экземпляра `Telemetry`.

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

#### Подробная информация

| Свойство      | Тип             | Описание                                                                                                                    | Значение по умолчанию             |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `serviceName` | `string`        | Необязательно, см. <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                        |
| `version`     | `string`        | Необязательно, см. <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Необязательно, текущая версия NocoBase |
| `trace`       | `TraceOptions`  | Необязательно, см. [Trace](./trace.md)                                                                                      | -                                 |
| `metric`      | `MetricOptions` | Необязательно, см. [Metric](./metric.md)                                                                                    | -                                 |

### `init()`

Регистрирует инструментацию (instrumentation), инициализирует `Trace` и `Metric`.

#### Сигнатура

- `init(): void`

### `start()`

Запускает обработчики данных, связанных с `Trace` и `Metric`, например: экспорт в Prometheus.

#### Сигнатура

- `start(): void`

### `shutdown()`

Останавливает обработчики данных `Trace` и `Metric`.

#### Сигнатура

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Добавляет библиотеки инструментирования.

#### Сигнатура

- `addInstrumentation(...instrumentation: InstrumentationOption[])`