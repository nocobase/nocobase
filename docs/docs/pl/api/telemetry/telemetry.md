:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/api/telemetry/telemetry).
:::

# Telemetria

## Przegląd

`Telemetry` to moduł telemetrii NocoBase, oparty na <a href="https://opentelemetry.io">OpenTelemetry</a>. Obsługuje on rejestrację narzędzi do metryk (Metric) oraz śledzenia (Trace) w ramach ekosystemu OpenTelemetry.

## Metody klasy

### `constructor()`

Konstruktor tworzący instancję `Telemetry`.

#### Sygnatura

- `constructor(options?: TelemetryOptions)`

#### Typ

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### Szczegóły

| Właściwość    | Typ             | Opis                                                                                                                         | Wartość domyślna             |
| ------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `serviceName` | `string`        | Opcjonalnie, patrz <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                   |
| `version`     | `string`        | Opcjonalnie, patrz <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Opcjonalnie, aktualny numer wersji NocoBase |
| `trace`       | `TraceOptions`  | Opcjonalnie, patrz [Trace](./trace.md)                                                                                       | -                            |
| `metric`      | `MetricOptions` | Opcjonalnie, patrz [Metric](./metric.md)                                                                                      | -                            |

### `init()`

Rejestruje instrumentację (instrumentation) oraz inicjalizuje `Trace` i `Metric`.

#### Sygnatura

- `init(): void`

### `start()`

Uruchamia procesy przetwarzania danych związanych z `Trace` i `Metric`, np. eksportowanie do Prometheus.

#### Sygnatura

- `start(): void`

### `shutdown()`

Zatrzymuje procesy przetwarzania danych związanych z `Trace` i `Metric`.

#### Sygnatura

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Dodaje biblioteki instrumentacji.

#### Sygnatura

- `addInstrumentation(...instrumentation: InstrumentationOption[])`