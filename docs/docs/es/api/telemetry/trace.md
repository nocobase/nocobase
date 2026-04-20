:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/api/telemetry/trace).
:::

# Trace

## Métodos de clase

### `constructor()`

Constructor para crear una instancia de `Trace`.

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

#### Detalles

| Propiedad       | Tipo                   | Descripción                                                | Valor por defecto           |
| --------------- | ---------------------- | ---------------------------------------------------------- | --------------------------- |
| `tracerName`    | `string`               | Identificador de trace                                     | `nocobase-trace`            |
| `version`       | `string`               |                                                            | Versión actual de NocoBase  |
| `processorName` | `string` \| `string[]` | Identificador(es) del `SpanProcessor` registrado a utilizar | -                           |

### `init()`

Inicializa `NodeTracerProvider`.

#### Firma

- `init(): void`

### `registerProcessor()`

Registra un `SpanProcessor`.

#### Firma

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Tipo

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Detalles

| Parámetro   | Tipo                  | Descripción                               |
| ----------- | --------------------- | ----------------------------------------- |
| `name`      | `string`              | Identificador único para `SpanProcessor`  |
| `processor` | `() => SpanProcessor` | Método para obtener el `SpanProcessor`    |

### `getTracer()`

Obtiene el `Tracer`.

#### Firma

- `getTracer(name?: string, version?: string)`

#### Detalles

| Parámetro | Tipo     | Descripción            | Valor por defecto          |
| --------- | -------- | ---------------------- | -------------------------- |
| `name`    | `string` | Identificador de trace | `nocobase-trace`           |
| `version` | `string` |                        | Versión actual de NocoBase |

### `start()`

Inicia el `SpanProcessor`.

#### Firma

- `start(): void`

### `shutdown()`

Detiene el `SpanProcessor`.

#### Firma

- `shutdown(): Promise<void>`