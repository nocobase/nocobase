:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/api/telemetry/telemetry).
:::

# Telemetrie

## Übersicht

`Telemetry` ist das Telemetrie-Modul von NocoBase, das auf <a href="https://opentelemetry.io">OpenTelemetry</a> basiert. Es unterstützt die Registrierung von Metriken (Metric) und Traces (Trace) innerhalb des OpenTelemetry-Ökosystems.

## Klassenmethoden

### `constructor()`

Konstruktor zum Erstellen einer `Telemetry`-Instanz.

#### Signatur

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

#### Details

| Eigenschaft   | Typ             | Beschreibung                                                                                                                | Standardwert               |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | Optional, siehe <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                 |
| `version`     | `string`        | Optional, siehe <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Optional, aktuelle NocoBase-Versionsnummer |
| `trace`       | `TraceOptions`  | Optional, siehe [Trace](./trace.md)                                                                                              | -                          |
| `metric`      | `MetricOptions` | Optional, siehe [Metric](./metric.md)                                                                                            | -                          |

### `init()`

Registriert die Instrumentierung und initialisiert `Trace` sowie `Metric`.

#### Signatur

- `init(): void`

### `start()`

Startet die Verarbeitung von `Trace`- und `Metric`-bezogenen Daten, wie z. B. den Export nach Prometheus.

#### Signatur

- `start(): void`

### `shutdown()`

Stoppt die Verarbeitung von `Trace`- und `Metric`-bezogenen Daten.

#### Signatur

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Fügt Instrumentierungs-Bibliotheken hinzu.

#### Signatur

- `addInstrumentation(...instrumentation: InstrumentationOption[])`