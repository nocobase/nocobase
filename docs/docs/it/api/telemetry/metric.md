:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/api/telemetry/metric).
:::

# Metric

## Metodi della classe

### `constructor()`

Costruttore per creare un'istanza di `Metric`.

#### Firma

- `constructor(options?: MetricOptions)`

#### Tipo

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Dettagli

| Proprietà     | Tipo                   | Descrizione                                       | Valore predefinito          |
| ------------- | ---------------------- | ------------------------------------------------- | --------------------------- |
| `meterName`   | `string`               | Identificatore del meter                          | `nocobase-meter`            |
| `version`     | `string`               |                                                   | Versione attuale di NocoBase |
| `readerName`  | `string` \| `string[]` | Identificatore/i dei `MetricReader` registrati da abilitare |                             |

### `init()`

Inizializza il `MetricProvider`.

#### Firma

- `init(): void`

### `registerReader()`

Registra un `MetricReader`.

#### Firma

- `registerReader(name: string, reader: GetMetricReader)`

#### Tipo

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Dettagli

| Parametro | Tipo                 | Descrizione                          |
| --------- | -------------------- | ------------------------------------ |
| `name`    | `string`             | Identificatore univoco per `MetricReader` |
| `reader`  | `() => MetricReader` | Metodo per ottenere il `MetricReader`       |

### `addView()`

Aggiunge una `View`. Consulti [Configure Metric Views](https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views).

#### Firma

- `addView(...view: View[])`

#### Tipo

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Ottiene il `Meter`.

#### Firma

- `getMeter(name?: string, version?: string)`

#### Dettagli

| Parametro | Tipo     | Descrizione      | Valore predefinito          |
| --------- | -------- | ---------------- | --------------------------- |
| `name`    | `string` | Identificatore del meter | `nocobase-meter`            |
| `version` | `string` |                  | Versione attuale di NocoBase |

### `start()`

Avvia il `MetricReader`.

#### Firma

- `start(): void`

### `shutdown()`

Arresta il `MetricReader`.

#### Firma

- `shutdown(): Promise<void>`