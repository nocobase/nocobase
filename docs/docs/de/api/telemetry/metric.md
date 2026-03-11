:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/api/telemetry/metric).
:::

# Metric

## Klassenmethoden

### `constructor()`

Konstruktor zum Erstellen einer `Metric`-Instanz.

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

#### Details

| Eigenschaft  | Typ                    | Beschreibung                                                              | Standardwert                |
| ------------ | ---------------------- | ------------------------------------------------------------------------- | --------------------------- |
| `meterName`  | `string`               | Meter-Bezeichner                                                          | `nocobase-meter`            |
| `version`    | `string`               |                                                                           | Aktuelle NocoBase-Versionsnummer |
| `readerName` | `string` \| `string[]` | Identifikator(en) der registrierten `MetricReader`, die aktiviert werden sollen |                             |

### `init()`

Initialisiert den `MetricProvider`.

#### Signatur

- `init(): void`

### `registerReader()`

Registriert einen `MetricReader`.

#### Signatur

- `registerReader(name: string, reader: GetMetricReader)`

#### Typ

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Details

| Parameter | Typ                  | Beschreibung                                 |
| --------- | -------------------- | -------------------------------------------- |
| `name`    | `string`             | Eindeutiger Identifikator für `MetricReader` |
| `reader`  | `() => MetricReader` | Methode zum Abrufen des `MetricReader`       |

### `addView()`

Fügt einen `View` hinzu. Siehe <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>.

#### Signatur

- `addView(...view: View[])`

#### Typ

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Ruft den `Meter` ab.

#### Signatur

- `getMeter(name?: string, version?: string)`

#### Details

| Parameter | Typ      | Beschreibung     | Standardwert                |
| --------- | -------- | ---------------- | --------------------------- |
| `name`    | `string` | Meter-Bezeichner | `nocobase-meter`            |
| `version` | `string` |                  | Aktuelle NocoBase-Versionsnummer |

### `start()`

Startet den `MetricReader`.

#### Signatur

- `start(): void`

### `shutdown()`

Stoppt den `MetricReader`.

#### Signatur

- `shutdown(): Promise<void>`