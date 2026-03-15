:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/api/telemetry/trace) voor nauwkeurige informatie.
:::

# Trace

## Class methods

### `constructor()`

Constructor om een `Trace`-instantie aan te maken.

#### Signatuur

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

| Eigenschap      | Type                   | Beschrijving                                          | Standaardwaarde             |
| --------------- | ---------------------- | ----------------------------------------------------- | --------------------------- |
| `tracerName`    | `string`               | Trace-id                                              | `nocobase-trace`            |
| `version`       | `string`               |                                                       | Huidige versie van NocoBase |
| `processorName` | `string` \| `string[]` | ID('s) van de geregistreerde `SpanProcessor` om te gebruiken | -                           |

### `init()`

Initialiseert de `NodeTracerProvider`.

#### Signatuur

- `init(): void`

### `registerProcessor()`

Registreert een `SpanProcessor`.

#### Signatuur

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Type

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Details

| Parameter   | Type                  | Beschrijving                          |
| ----------- | --------------------- | ------------------------------------- |
| `name`      | `string`              | Unieke identificatie voor `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Methode om de `SpanProcessor` op te halen |

### `getTracer()`

Haalt de `Tracer` op.

#### Signatuur

- `getTracer(name?: string, version?: string)`

#### Details

| Parameter | Type     | Beschrijving     | Standaardwaarde             |
| --------- | -------- | ---------------- | --------------------------- |
| `name`    | `string` | Trace-id         | `nocobase-trace`            |
| `version` | `string` |                  | Huidige versie van NocoBase |

### `start()`

Start de `SpanProcessor`.

#### Signatuur

- `start(): void`

### `shutdown()`

Stopt de `SpanProcessor`.

#### Signatuur

- `shutdown(): Promise<void>`