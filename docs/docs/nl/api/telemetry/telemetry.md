:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/api/telemetry/telemetry) voor nauwkeurige informatie.
:::

# Telemetrie

## Overzicht

`Telemetry` is de telemetriemodule van NocoBase, gebaseerd op <a href="https://opentelemetry.io">OpenTelemetry</a>. Het ondersteunt het registreren van metrieken (Metric) en traces (Trace) binnen het OpenTelemetry-ecosysteem.

## Klassemethoden

### `constructor()`

Constructor om een `Telemetry`-instantie aan te maken.

#### Signatuur

- `constructor(options?: TelemetryOptions)`

#### Type

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### Details

| Eigenschap    | Type            | Beschrijving                                                                                                                | Standaardwaarde            |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | Optioneel. Raadpleeg <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                 |
| `version`     | `string`        | Optioneel. Raadpleeg <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Optioneel, huidig NocoBase-versienummer |
| `trace`       | `TraceOptions`  | Optioneel. Raadpleeg [Trace](./trace.md)                                                                                    | -                          |
| `metric`      | `MetricOptions` | Optioneel. Raadpleeg [Metric](./metric.md)                                                                                  | -                          |

### `init()`

Registreert instrumentatie en initialiseert `Trace` en `Metric`.

#### Signatuur

- `init(): void`

### `start()`

Start de verwerking van `Trace`- en `Metric`-gerelateerde gegevens, zoals het exporteren naar Prometheus.

#### Signatuur

- `start(): void`

### `shutdown()`

Stopt de verwerking van `Trace`- en `Metric`-gerelateerde gegevens.

#### Signatuur

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Voegt instrumentatiebibliotheken toe.

#### Signatuur

- `addInstrumentation(...instrumentation: InstrumentationOption[])`