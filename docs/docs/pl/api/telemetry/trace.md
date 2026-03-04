:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/api/telemetry/trace).
:::

# Trace

## Metody klasy

### `constructor()`

Konstruktor tworzący instancję `Trace`.

#### Sygnatura

- `constructor(options?: TraceOptions)`

#### Typ

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### Szczegóły

| Właściwość      | Typ                    | Opis                                                   | Wartość domyślna            |
| --------------- | ---------------------- | ------------------------------------------------------ | --------------------------- |
| `tracerName`    | `string`               | Identyfikator trace                                    | `nocobase-trace`            |
| `version`       | `string`               |                                                        | Aktualna wersja NocoBase    |
| `processorName` | `string` \| `string[]` | Identyfikatory zarejestrowanych `SpanProcessor` do użycia |                             |

### `init()`

Inicjalizuje `NodeTracerProvider`.

#### Sygnatura

- `init(): void`

### `registerProcessor()`

Rejestruje `SpanProcessor`.

#### Sygnatura

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Typ

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Szczegóły

| Parametr    | Typ                   | Opis                                  |
| ----------- | --------------------- | ------------------------------------- |
| `name`      | `string`              | Unikalny identyfikator `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Metoda pobierająca `SpanProcessor`    |

### `getTracer()`

Pobiera `Tracer`.

#### Sygnatura

- `getTracer(name?: string, version?: string)`

#### Szczegóły

| Parametr  | Typ      | Opis                | Wartość domyślna         |
| --------- | -------- | ------------------- | ------------------------ |
| `name`    | `string` | Identyfikator trace | `nocobase-trace`         |
| `version` | `string` |                     | Aktualna wersja NocoBase |

### `start()`

Uruchamia `SpanProcessor`.

#### Sygnatura

- `start(): void`

### `shutdown()`

Zatrzymuje `SpanProcessor`.

#### Sygnatura

- `shutdown(): Promise<void>`