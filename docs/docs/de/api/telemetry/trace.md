:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/api/telemetry/trace).
:::

# Trace

## Klassenmethoden

### `constructor()`

Konstruktor zum Erstellen einer `Trace`-Instanz.

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

#### Details

| Eigenschaft     | Typ                    | Beschreibung                                           | Standardwert                |
| --------------- | ---------------------- | ------------------------------------------------------ | --------------------------- |
| `tracerName`    | `string`               | Trace-Identifikator                                    | `nocobase-trace`            |
| `version`       | `string`               |                                                        | Aktuelle NocoBase-Versionsnummer |
| `processorName` | `string` \| `string[]` | Identifikator(en) der zu verwendenden registrierten `SpanProcessor` |                             |

### `init()`

Initialisiert den `NodeTracerProvider`.

#### Signatur

- `init(): void`

### `registerProcessor()`

Registriert einen `SpanProcessor`.

#### Signatur

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Typ

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Details

| Parameter   | Typ                   | Beschreibung                                |
| ----------- | --------------------- | ------------------------------------------- |
| `name`      | `string`              | Eindeutiger Identifikator für den `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Methode zum Abrufen des `SpanProcessor`     |

### `getTracer()`

Ruft den `Tracer` ab.

#### Signatur

- `getTracer(name?: string, version?: string)`

#### Details

| Parameter | Typ      | Beschreibung        | Standardwert                |
| --------- | -------- | ------------------- | --------------------------- |
| `name`    | `string` | Trace-Identifikator | `nocobase-trace`            |
| `version` | `string` |                     | Aktuelle NocoBase-Versionsnummer |

### `start()`

Startet den `SpanProcessor`.

#### Signatur

- `start(): void`

### `shutdown()`

Stoppt den `SpanProcessor`.

#### Signatur

- `shutdown(): Promise<void>`