:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/api/telemetry/telemetry).
:::

# Télémétrie

## Aperçu

`Telemetry` est le module de télémétrie de NocoBase, encapsulant <a href="https://opentelemetry.io">OpenTelemetry</a> pour prendre en charge l'enregistrement des outils de métriques (Metric) et de traces (Trace) de l'écosystème OpenTelemetry.

## Méthodes de classe

### `constructor()`

Constructeur, crée une instance de `Telemetry`.

#### Signature

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

#### Détails

| Propriété     | Type            | Description                                                                                                                 | Valeur par défaut                 |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `serviceName` | `string`        | Optionnel, consultez les <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                        |
| `version`     | `string`        | Optionnel, consultez les <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Optionnel, version actuelle de NocoBase |
| `trace`       | `TraceOptions`  | Optionnel, consultez [Trace](./trace.md)                                                                                    | -                                 |
| `metric`      | `MetricOptions` | Optionnel, consultez [Metric](./metric.md)                                                                                  | -                                 |

### `init()`

Enregistre l'instrumentation et initialise `Trace` et `Metric`.

#### Signature

- `init(): void`

### `start()`

Démarre les processeurs de données liés à `Trace` et `Metric`, par exemple : l'exportation vers Prometheus.

#### Signature

- `start(): void`

### `shutdown()`

Arrête les processeurs de données liés à `Trace` et `Metric`.

#### Signature

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Ajoute des bibliothèques d'instrumentation.

#### Signature

- `addInstrumentation(...instrumentation: InstrumentationOption[])`