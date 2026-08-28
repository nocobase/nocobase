# Telemetry - Телеметрия

## Обзор

`Telemetry` — это модуль телеметрии NocoBase, построенный на базе <a href="https://opentelemetry.io">OpenTelemetry</a>. Он поддерживает регистрацию инструментов для метрик и трассировок в экосистеме OpenTelemetry.

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

#### Подробности

| Свойство            | Тип             | Описание                                                                                                         | Значение по умолчанию                  |
| ------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `serviceName`       | `string`        | Необязательный параметр. См. [Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/resource/#service). | `nocobase`                             |
| `version`           | `string`        | Необязательный параметр. См. [Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/resource/#service). | Необязательный, текущая версия NocoBase |
| `trace`             | `TraceOptions`  | Необязательный параметр. См. [Trace](./trace.md).                                                                 | -                                      |
| `metric`            | `MetricOptions` | Необязательный параметр. См. [Metric](./metric.md).                                                               | -                                      |

### `init()`

Регистрирует инструментацию и инициализирует модули `Trace` и `Metric`.

#### Сигнатура

- `init(): void`

### `start()`

Запускает обработку данных, связанных с `Trace` и `Metric` (например, экспорт в Prometheus).

#### Сигнатура

- `start(): void`

### `shutdown()`

Останавливает обработку данных, связанных с `Trace` и `Metric`.

#### Сигнатура

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Добавляет библиотеки инструментации.

#### Сигнатура

- `addInstrumentation(...instrumentation: InstrumentationOption[])`