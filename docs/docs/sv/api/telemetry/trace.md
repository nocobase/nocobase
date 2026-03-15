:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/api/telemetry/trace).
:::

# Trace

## Klassmetoder

### `constructor()`

Konstruktor för att skapa en `Trace`-instans.

#### Signatur

- `constructor(options?: TraceOptions)`

#### Typ

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### Detaljer

| Egenskap        | Typ                    | Beskrivning                                         | Standardvärde               |
| --------------- | ---------------------- | --------------------------------------------------- | --------------------------- |
| `tracerName`    | `string`               | Trace-identifierare                                 | `nocobase-trace`            |
| `version`       | `string`               |                                                     | Aktuell version av NocoBase |
| `processorName` | `string` \| `string[]` | Identifierare för registrerade `SpanProcessor` som ska användas | -                           |

### `init()`

Initierar `NodeTracerProvider`.

#### Signatur

- `init(): void`

### `registerProcessor()`

Registrerar en `SpanProcessor`.

#### Signatur

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Typ

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Detaljer

| Parameter   | Typ                   | Beskrivning                           |
| ----------- | --------------------- | ------------------------------------- |
| `name`      | `string`              | Unik identifierare för `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Metod för att hämta `SpanProcessor`   |

### `getTracer()`

Hämtar `Tracer`.

#### Signatur

- `getTracer(name?: string, version?: string)`

#### Detaljer

| Parameter | Typ      | Beskrivning        | Standardvärde               |
| --------- | -------- | ------------------ | --------------------------- |
| `name`    | `string` | Trace-identifierare | `nocobase-trace`            |
| `version` | `string` |                    | Aktuell version av NocoBase |

### `start()`

Startar `SpanProcessor`.

#### Signatur

- `start(): void`

### `shutdown()`

Stoppar `SpanProcessor`.

#### Signatur

- `shutdown(): Promise<void>`