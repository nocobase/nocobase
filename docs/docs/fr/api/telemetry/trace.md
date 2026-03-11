:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/api/telemetry/trace).
:::

# Trace

## Méthodes de classe

### `constructor()`

Constructeur pour créer une instance de `Trace`.

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

#### Détails

| Propriété       | Type                   | Description                                          | Valeur par défaut           |
| --------------- | ---------------------- | ---------------------------------------------------- | --------------------------- |
| `tracerName`    | `string`               | Identifiant de trace                                 | `nocobase-trace`            |
| `version`       | `string`               |                                                      | Version actuelle de NocoBase |
| `processorName` | `string` \| `string[]` | Identifiant(s) du `SpanProcessor` enregistré à utiliser | -                           |

### `init()`

Initialise `NodeTracerProvider`.

#### Signature

- `init(): void`

### `registerProcessor()`

Enregistre un `SpanProcessor`.

#### Signature

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Type

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Détails

| Paramètre   | Type                  | Description                             |
| ----------- | --------------------- | --------------------------------------- |
| `name`      | `string`              | Identifiant unique pour `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Méthode pour obtenir le `SpanProcessor` |

### `getTracer()`

Obtient le `Tracer`.

#### Signature

- `getTracer(name?: string, version?: string)`

#### Détails

| Paramètre | Type     | Description          | Valeur par défaut           |
| --------- | -------- | -------------------- | --------------------------- |
| `name`    | `string` | Identifiant de trace | `nocobase-trace`            |
| `version` | `string` |                      | Version actuelle de NocoBase |

### `start()`

Démarre le `SpanProcessor`.

#### Signature

- `start(): void`

### `shutdown()`

Arrête le `SpanProcessor`.

#### Signature

- `shutdown(): Promise<void>`