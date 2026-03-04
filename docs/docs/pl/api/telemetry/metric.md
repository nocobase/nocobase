:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/api/telemetry/metric).
:::

# Metric

## Metody klasy

### `constructor()`

Konstruktor tworzący instancję klasy `Metric`.

#### Sygnatura

- `constructor(options?: MetricOptions)`

#### Typ

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Szczegóły

| Właściwość   | Typ                    | Opis                                                      | Wartość domyślna            |
| ------------ | ---------------------- | --------------------------------------------------------- | --------------------------- |
| `meterName`  | `string`               | Identyfikator miernika (meter)                            | `nocobase-meter`            |
| `version`    | `string`               |                                                           | Aktualny numer wersji NocoBase |
| `readerName` | `string` \| `string[]` | Identyfikator(y) zarejestrowanych `MetricReader` do użycia |                             |

### `init()`

Inicjalizuje `MetricProvider`.

#### Sygnatura

- `init(): void`

### `registerReader()`

Rejestruje `MetricReader`.

#### Sygnatura

- `registerReader(name: string, reader: GetMetricReader)`

#### Typ

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Szczegóły

| Parametr | Typ                  | Opis                                   |
| -------- | -------------------- | -------------------------------------- |
| `name`   | `string`             | Unikalny identyfikator `MetricReader`  |
| `reader` | `() => MetricReader` | Metoda pobierająca `MetricReader`      |

### `addView()`

Dodaje `View`. Zobacz <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>.

#### Sygnatura

- `addView(...view: View[])`

#### Typ

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Pobiera `Meter`.

#### Sygnatura

- `getMeter(name?: string, version?: string)`

#### Szczegóły

| Parametr  | Typ      | Opis                           | Wartość domyślna            |
| --------- | -------- | ------------------------------ | --------------------------- |
| `name`    | `string` | Identyfikator miernika (meter) | `nocobase-meter`            |
| `version` | `string` |                                | Aktualny numer wersji NocoBase |

### `start()`

Uruchamia `MetricReader`.

#### Sygnatura

- `start(): void`

### `shutdown()`

Zatrzymuje `MetricReader`.

#### Sygnatura

- `shutdown(): Promise<void>`