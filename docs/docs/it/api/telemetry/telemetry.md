:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/api/telemetry/telemetry).
:::

# Telemetria

## Panoramica

`Telemetry` è il modulo di telemetria di NocoBase, basato su <a href="https://opentelemetry.io">OpenTelemetry</a>, che supporta la registrazione di strumenti per metriche (Metric) e tracce (Trace) all'interno dell'ecosistema OpenTelemetry.

## Metodi della classe

### `constructor()`

Costruttore, crea un'istanza di `Telemetry`.

#### Firma

- `constructor(options?: TelemetryOptions)`

#### Tipo

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### Dettagli

| Proprietà      | Tipo            | Descrizione                                                                                              | Valore predefinito                      |
| ------------- | --------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `serviceName` | `string`        | Opzionale, consulti le <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                         |
| `version`     | `string`        | Opzionale, consulti le <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Opzionale, versione attuale di NocoBase |
| `trace`       | `TraceOptions`  | Opzionale, consulti [Trace](./trace.md)                                                                   | -                                  |
| `metric`      | `MetricOptions` | Opzionale, consulti [Metric](./metric.md)                                                                 | -                                  |

### `init()`

Registra la strumentazione (instrumentation) e inizializza `Trace` e `Metric`.

#### Firma

- `init(): void`

### `start()`

Avvia i processi di elaborazione dei dati relativi a `Trace` e `Metric`, come l'esportazione verso Prometheus.

#### Firma

- `start(): void`

### `shutdown()`

Arresta i processi di elaborazione dei dati relativi a `Trace` e `Metric`.

#### Firma

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Aggiunge librerie di strumentazione.

#### Firma

- `addInstrumentation(...instrumentation: InstrumentationOption[])`