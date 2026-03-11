:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/api/telemetry/telemetry).
:::

# Telemetri

## Översikt

`Telemetry` är telemetrimodulen i NocoBase, baserad på <a href="https://opentelemetry.io">OpenTelemetry</a>, med stöd för att registrera mätvärden (Metric) och spårning (Trace) inom OpenTelemetry-ekosystemet.

## Klassmetoder

### `constructor()`

Konstruktor för att skapa en `Telemetry`-instans.

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

#### Detaljerad information

| Egenskap      | Typ             | Beskrivning                                                                                                                 | Standardvärde              |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | Valfri, se <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                 |
| `version`     | `string`        | Valfri, se <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Valfri, nuvarande NocoBase-versionsnummer |
| `trace`       | `TraceOptions`  | Valfri, se [Trace](./trace.md)                                                                                              | -                          |
| `metric`      | `MetricOptions` | Valfri, se [Metric](./metric.md)                                                                                            | -                          |

### `init()`

Registrerar instrumentering och initierar `Trace` och `Metric`.

#### Signatur

- `init(): void`

### `start()`

Startar hanteringen av data relaterad till `Trace` och `Metric`, såsom export till Prometheus.

#### Signatur

- `start(): void`

### `shutdown()`

Stoppar hanteringen av data relaterad till `Trace` och `Metric`.

#### Signatur

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Lägger till instrumenteringsbibliotek.

#### Signatur

- `addInstrumentation(...instrumentation: InstrumentationOption[])`