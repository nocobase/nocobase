:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/api/telemetry/metric).
:::

# Metric

## Méthodes de classe

### `constructor()`

Constructeur pour créer une instance de `Metric`.

#### Signature

- `constructor(options?: MetricOptions)`

#### Type

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Détails

| Propriété    | Type                   | Description                                               | Valeur par défaut           |
| ------------ | ---------------------- | --------------------------------------------------------- | --------------------------- |
| `meterName`  | `string`               | Identifiant du meter                                      | `nocobase-meter`            |
| `version`    | `string`               |                                                           | Version actuelle de NocoBase |
| `readerName` | `string` \| `string[]` | Identifiant(s) du ou des `MetricReader` enregistrés à utiliser |                             |

### `init()`

Initialise le `MetricProvider`.

#### Signature

- `init(): void`

### `registerReader()`

Enregistre un `MetricReader`.

#### Signature

- `registerReader(name: string, reader: GetMetricReader)`

#### Type

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Détails

| Paramètre   | Type                 | Description                               |
| ----------- | -------------------- | ----------------------------------------- |
| `name`      | `string`             | Identifiant unique pour le `MetricReader` |
| `processor` | `() => MetricReader` | Méthode pour obtenir le `MetricReader`    |

### `addView()`

Ajoute une `View`. Consultez <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>.

#### Signature

- `addView(...view: View[])`

#### Type

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Obtient le `Meter`.

#### Signature

- `getMeter(name?: string, version?: string)`

#### Détails

| Paramètre | Type     | Description          | Valeur par défaut           |
| --------- | -------- | -------------------- | --------------------------- |
| `name`    | `string` | Identifiant du meter | `nocobase-meter`            |
| `version` | `string` |                      | Version actuelle de NocoBase |

### `start()`

Démarre le `MetricReader`.

#### Signature

- `start(): void`

### `shutdown()`

Arrête le `MetricReader`.

#### Signature

- `shutdown(): Promise<void>`