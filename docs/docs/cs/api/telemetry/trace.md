:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/api/telemetry/trace).
:::

# Trace

## Metody třídy

### `constructor()`

Konstruktor pro vytvoření instance `Trace`.

#### Signatura

- `constructor(options?: TraceOptions)`

#### Typ

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### Podrobnosti

| Vlastnost       | Typ                    | Popis                                              | Výchozí hodnota       |
| --------------- | ---------------------- | -------------------------------------------------- | --------------------- |
| `tracerName`    | `string`               | Identifikátor trasování (trace)                    | `nocobase-trace`      |
| `version`       | `string`               |                                                    | Aktuální verze NocoBase |
| `processorName` | `string` \| `string[]` | Identifikátor(y) registrovaných `SpanProcessor`, které chcete povolit |                     |

### `init()`

Inicializuje `NodeTracerProvider`.

#### Signatura

- `init(): void`

### `registerProcessor()`

Registruje `SpanProcessor`.

#### Signatura

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Typ

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Podrobnosti

| Parametr    | Typ                   | Popis                                   |
| ----------- | --------------------- | --------------------------------------- |
| `name`      | `string`              | Jedinečný identifikátor `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Metoda pro získání `SpanProcessor`      |

### `getTracer()`

Získá `Tracer`.

#### Signatura

- `getTracer(name?: string, version?: string)`

#### Podrobnosti

| Parametr  | Typ      | Popis                           | Výchozí hodnota       |
| --------- | -------- | ------------------------------- | --------------------- |
| `name`    | `string` | Identifikátor trasování (trace) | `nocobase-trace`      |
| `version` | `string` |                                 | Aktuální verze NocoBase |

### `start()`

Spustí `SpanProcessor`.

#### Signatura

- `start(): void`

### `shutdown()`

Zastaví `SpanProcessor`.

#### Signatura

- `shutdown(): Promise<void>`