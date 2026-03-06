:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/api/telemetry/trace).
:::

# Trace

## Metodi della classe

### `constructor()`

Costruttore per creare un'istanza di `Trace`.

#### Firma

- `constructor(options?: TraceOptions)`

#### Tipo

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### Dettagli

| Proprietà       | Tipo                   | Descrizione                                             | Valore predefinito          |
| --------------- | ---------------------- | ------------------------------------------------------- | --------------------------- |
| `tracerName`    | `string`               | Identificatore del trace                                | `nocobase-trace`            |
| `version`       | `string`               |                                                         | Versione attuale di NocoBase |
| `processorName` | `string` \| `string[]` | Identificatore/i dello `SpanProcessor` registrato da utilizzare |                             |

### `init()`

Inizializza `NodeTracerProvider`.

#### Firma

- `init(): void`

### `registerProcessor()`

Registra uno `SpanProcessor`.

#### Firma

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Tipo

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Dettagli

| Parametro   | Tipo                  | Descrizione                               |
| ----------- | --------------------- | ----------------------------------------- |
| `name`      | `string`              | Identificatore univoco per `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Metodo per ottenere lo `SpanProcessor`    |

### `getTracer()`

Ottiene il `Tracer`.

#### Firma

- `getTracer(name?: string, version?: string)`

#### Dettagli

| Parametro | Tipo     | Descrizione              | Valore predefinito          |
| --------- | -------- | ------------------------ | --------------------------- |
| `name`    | `string` | Identificatore del trace | `nocobase-trace`            |
| `version` | `string` |                          | Versione attuale di NocoBase |

### `start()`

Avvia lo `SpanProcessor`.

#### Firma

- `start(): void`

### `shutdown()`

Arresta lo `SpanProcessor`.

#### Firma

- `shutdown(): Promise<void>`