# Metric

## Class Methods

### `constructor()`

Constructor to create a `Metric` instance.

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

#### Details

| Property     | Type                   | Description                                       | Default Value               |
| ------------ | ---------------------- | ------------------------------------------------- | --------------------------- |
| `meterName`  | `string`               | Meter identifier                                  | `nocobase-meter`            |
| `version`    | `string`               |                                                   | Current version of NocoBase |
| `readerName` | `string` \| `string[]` | Identifier(s) of registered `MetricReader` to use | -                           |

### `init()`

Initializes `MetricProvider`.

#### Signature

- `init(): void`

### `registerReader()`

Registers a `MetricReader`.

#### Signature

- `registerReader(name: string, reader: GetMetricReader)`

#### Type

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Details

| Parameter | Type                 | Description                          |
| --------- | -------------------- | ------------------------------------ |
| `name`    | `string`             | Unique identifier for `MetricReader` |
| `reader`  | `() => MetricReader` | Function to get `MetricReader`       |

### `addView()`

Adds a `View`. Refer to [Configure Metric Views](https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views).

#### Signature

- `addView(...view: View[])`

#### Type

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Gets the `Meter`.

#### Signature

- `getMeter(name?: string, version?: string)`

#### Details

| Parameter | Type     | Description      | Default Value               |
| --------- | -------- | ---------------- | --------------------------- |
| `name`    | `string` | Meter identifier | `nocobase-meter`            |
| `version` | `string` |                  | Current version of NocoBase |

### `start()`

Starts the `MetricReader`.

#### Signature

- `start(): void`

### `shutdown()`

Stops the `MetricReader`.

#### Signature

- `shutdown(): Promise<void>`
