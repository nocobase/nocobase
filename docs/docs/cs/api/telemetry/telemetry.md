:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/api/telemetry/telemetry).
:::

# Telemetrie

## Přehled

`Telemetry` je telemetrický modul systému NocoBase, postavený na <a href="https://opentelemetry.io">OpenTelemetry</a>. Podporuje registraci nástrojů pro metriky (Metric) a trasování (Trace) v rámci ekosystému OpenTelemetry.

## Metody třídy

### `constructor()`

Konstruktor pro vytvoření instance `Telemetry`.

#### Signatura

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

#### Podrobnosti

| Vlastnost     | Typ             | Popis                                                                                                                       | Výchozí hodnota            |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | Volitelné, viz <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                 |
| `version`     | `string`        | Volitelné, viz <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Volitelné, aktuální verze NocoBase |
| `trace`       | `TraceOptions`  | Volitelné, viz [Trace](./trace.md)                                                                                              | -                          |
| `metric`      | `MetricOptions` | Volitelné, viz [Metric](./metric.md)                                                                                            | -                          |

### `init()`

Registruje instrumentaci a inicializuje `Trace` a `Metric`.

#### Signatura

- `init(): void`

### `start()`

Spouští zpracování dat souvisejících s `Trace` a `Metric`, například export do systému Prometheus.

#### Signatura

- `start(): void`

### `shutdown()`

Zastavuje zpracování dat souvisejících s `Trace` a `Metric`.

#### Signatura

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Přidává knihovny pro instrumentaci (插桩工具库).

#### Signatura

- `addInstrumentation(...instrumentation: InstrumentationOption[])`