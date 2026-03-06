:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/api/telemetry/telemetry).
:::

# Telemetría

## Generalidades

`Telemetry` es el módulo de telemetría de NocoBase, basado en <a href="https://opentelemetry.io">OpenTelemetry</a>, que permite registrar herramientas de métricas (Metric) y trazas (Trace) dentro del ecosistema de OpenTelemetry.

## Métodos de clase

### `constructor()`

Constructor para crear una instancia de `Telemetry`.

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

#### Detalles

| Propiedad     | Tipo            | Descripción                                                                                                                 | Valor por defecto                  |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `serviceName` | `string`        | Opcional. Consulte las <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Convenciones Semánticas</a> | `nocobase`                         |
| `version`     | `string`        | Opcional. Consulte las <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Convenciones Semánticas</a> | Opcional, versión actual de NocoBase |
| `trace`       | `TraceOptions`  | Opcional. Consulte [Trace](./trace.md)                                                                                      | -                                  |
| `metric`      | `MetricOptions` | Opcional. Consulte [Metric](./metric.md)                                                                                    | -                                  |

### `init()`

Registra la instrumentación e inicializa `Trace` y `Metric`.

#### Firma

- `init(): void`

### `start()`

Inicia los procesadores de datos relacionados con `Trace` y `Metric`, como por ejemplo, la exportación a Prometheus.

#### Firma

- `start(): void`

### `shutdown()`

Detiene los procesadores de datos relacionados con `Trace` y `Metric`.

#### Firma

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Añade bibliotecas de instrumentación.

#### Firma

- `addInstrumentation(...instrumentation: InstrumentationOption[])`