# Trace

## Class Methods

### `constructor()`

Constructor to create a `Trace` instance.

#### Signature

- `constructor(options?: TraceOptions)`

#### Type

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### Details

| Property        | Type                   | Description                                        | Default Value               |
| --------------- | ---------------------- | -------------------------------------------------- | --------------------------- |
| `tracerName`    | `string`               | Trace identifier                                   | `nocobase-trace`            |
| `version`       | `string`               |                                                    | Current version of NocoBase |
| `processorName` | `string` \| `string[]` | Identifier(s) of registered `SpanProcessor` to use | -                           |

### `init()`

Initializes `NodeTracerProvider`.

#### Signature

- `init(): void`

### `registerProcessor()`

Registers a `SpanProcessor`.

#### Signature

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Type

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Details

| Parameter   | Type                  | Description                           |
| ----------- | --------------------- | ------------------------------------- |
| `name`      | `string`              | Unique identifier for `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Function to get `SpanProcessor`       |

### `getTracer()`

Gets the `Tracer`.

#### Signature

- `getTracer(name?: string, version?: string)`

#### Details

| Parameter | Type     | Description      | Default Value               |
| --------- | -------- | ---------------- | --------------------------- |
| `name`    | `string` | Trace identifier | `nocobase-trace`            |
| `version` | `string` |                  | Current version of NocoBase |

### `start()`

Starts the `SpanProcessor`.

#### Signature

- `start(): void`

### `shutdown()`

Stops the `SpanProcessor`.

#### Signature

- `shutdown(): Promise<void>`
