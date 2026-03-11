:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/api/telemetry/metric) voor nauwkeurige informatie.
:::

# Metric

## Class-methoden

### `constructor()`

Constructor om een `Metric`-instantie aan te maken.

#### Signatuur

- `constructor(options?: MetricOptions)`

#### Type

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Details

| Eigenschap   | Type                   | Beschrijving                                          | Standaardwaarde             |
| ------------ | ---------------------- | ----------------------------------------------------- | --------------------------- |
| `meterName`  | `string`               | Meter-identificatie                                   | `nocobase-meter`            |
| `version`    | `string`               |                                                       | Huidige versie van NocoBase |
| `readerName` | `string` \| `string[]` | Identificatie van de geregistreerde `MetricReader` die u wilt inschakelen |                     |

### `init()`

Initialiseert `MetricProvider`.

#### Signatuur

- `init(): void`

### `registerReader()`

Registreert een `MetricReader`.

#### Signatuur

- `registerReader(name: string, reader: GetMetricReader)`

#### Type

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Details

| Parameter   | Type                 | Beschrijving                          |
| ----------- | -------------------- | ------------------------------------- |
| `name`      | `string`             | Unieke identificatie voor `MetricReader` |
| `reader`    | `() => MetricReader` | Methode om de `MetricReader` te verkrijgen |

### `addView()`

Voegt een `View` toe. Raadpleeg <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>.

#### Signatuur

- `addView(...view: View[])`

#### Type

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Verkrijgt de `Meter`.

#### Signatuur

- `getMeter(name?: string, version?: string)`

#### Details

| Parameter | Type     | Beschrijving       | Standaardwaarde             |
| --------- | -------- | ------------------ | --------------------------- |
| `name`    | `string` | Meter-identificatie | `nocobase-meter`            |
| `version` | `string` |                    | Huidige versie van NocoBase |

### `start()`

Start de `MetricReader`.

#### Signatuur

- `start(): void`

### `shutdown()`

Stopt de `MetricReader`.

#### Signatuur

- `shutdown(): Promise<void>`