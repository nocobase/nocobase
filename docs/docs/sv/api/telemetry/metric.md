:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/api/telemetry/metric).
:::

# Metric

## Klassmetoder

### `constructor()`

Konstruktor för att skapa en instans av `Metric`.

#### Signatur

- `constructor(options?: MetricOptions)`

#### Typ

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Detaljer

| Egenskap     | Typ                    | Beskrivning                                           | Standardvärde               |
| ------------ | ---------------------- | ----------------------------------------------------- | --------------------------- |
| `meterName`  | `string`               | Meter-identifierare                                   | `nocobase-meter`            |
| `version`    | `string`               |                                                       | NocoBase nuvarande versionsnummer |
| `readerName` | `string` \| `string[]` | Identifierare för registrerade `MetricReader` som ni önskar aktivera |                             |

### `init()`

Initierar `MetricProvider`.

#### Signatur

- `init(): void`

### `registerReader()`

Registrerar en `MetricReader`.

#### Signatur

- `registerReader(name: string, reader: GetMetricReader)`

#### Typ

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Detaljer

| Parameter   | Typ                  | Beskrivning                          |
| ----------- | -------------------- | ------------------------------------ |
| `name`      | `string`             | Unik identifierare för `MetricReader` |
| `reader`    | `() => MetricReader` | Metod för att hämta `MetricReader`   |

### `addView()`

Lägger till en `View`. Se <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>.

#### Signatur

- `addView(...view: View[])`

#### Typ

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Hämtar en `Meter`.

#### Signatur

- `getMeter(name?: string, version?: string)`

#### Detaljer

| Parameter | Typ      | Beskrivning        | Standardvärde               |
| --------- | -------- | ------------------ | --------------------------- |
| `name`    | `string` | Meter-identifierare | `nocobase-meter`            |
| `version` | `string` |                    | NocoBase nuvarande versionsnummer |

### `start()`

Startar `MetricReader`.

#### Signatur

- `start(): void`

### `shutdown()`

Stoppar `MetricReader`.

#### Signatur

- `shutdown(): Promise<void>`