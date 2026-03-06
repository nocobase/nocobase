:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/api/telemetry/metric).
:::

# Metric

## Metody třídy

### `constructor()`

Konstruktor pro vytvoření instance třídy `Metric`.

#### Signatura

- `constructor(options?: MetricOptions)`

#### Typ

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Podrobnosti

| Vlastnost    | Typ                    | Popis                                              | Výchozí hodnota         |
| ------------ | ---------------------- | -------------------------------------------------- | ----------------------- |
| `meterName`  | `string`               | Identifikátor meteru                               | `nocobase-meter`        |
| `version`    | `string`               |                                                    | Aktuální verze NocoBase |
| `readerName` | `string` \| `string[]` | Identifikátor(y) registrovaných `MetricReader`, které se mají použít |                         |

### `init()`

Inicializuje `MetricProvider`.

#### Signatura

- `init(): void`

### `registerReader()`

Registruje `MetricReader`.

#### Signatura

- `registerReader(name: string, reader: GetMetricReader)`

#### Typ

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Podrobnosti

| Parametr | Typ                  | Popis                                   |
| -------- | -------------------- | --------------------------------------- |
| `name`   | `string`             | Jedinečný identifikátor `MetricReader`  |
| `reader` | `() => MetricReader` | Metoda pro získání `MetricReader`       |

### `addView()`

Přidá `View`. Viz <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>.

#### Signatura

- `addView(...view: View[])`

#### Typ

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Získá `Meter`.

#### Signatura

- `getMeter(name?: string, version?: string)`

#### Podrobnosti

| Parametr  | Typ      | Popis                | Výchozí hodnota         |
| --------- | -------- | -------------------- | ----------------------- |
| `name`    | `string` | Identifikátor meteru | `nocobase-meter`        |
| `version` | `string` |                      | Aktuální verze NocoBase |

### `start()`

Spustí `MetricReader`.

#### Signatura

- `start(): void`

### `shutdown()`

Zastaví `MetricReader`.

#### Signatura

- `shutdown(): Promise<void>`