:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/api/telemetry/trace).
:::

# Trace

## Métodos da classe

### `constructor()`

Construtor para criar uma instância de `Trace`.

#### Assinatura

- `constructor(options?: TraceOptions)`

#### Tipo

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### Detalhes

| Propriedade     | Tipo                   | Descrição                                          | Valor padrão                |
| --------------- | ---------------------- | -------------------------------------------------- | --------------------------- |
| `tracerName`    | `string`               | Identificador do trace                             | `nocobase-trace`            |
| `version`       | `string`               |                                                    | Versão atual do NocoBase    |
| `processorName` | `string` \| `string[]` | Identificador(es) do `SpanProcessor` registrado para usar | -                           |

### `init()`

Inicializa o `NodeTracerProvider`.

#### Assinatura

- `init(): void`

### `registerProcessor()`

Registra um `SpanProcessor`.

#### Assinatura

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Tipo

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Detalhes

| Parâmetro   | Tipo                  | Descrição                             |
| ----------- | --------------------- | ------------------------------------- |
| `name`      | `string`              | Identificador único do `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Função para obter o `SpanProcessor`   |

### `getTracer()`

Obtém o `Tracer`.

#### Assinatura

- `getTracer(name?: string, version?: string)`

#### Detalhes

| Parâmetro | Tipo     | Descrição              | Valor padrão                |
| --------- | -------- | ---------------------- | --------------------------- |
| `name`    | `string` | Identificador do trace | `nocobase-trace`            |
| `version` | `string` |                        | Versão atual do NocoBase    |

### `start()`

Inicia o `SpanProcessor`.

#### Assinatura

- `start(): void`

### `shutdown()`

Para o `SpanProcessor`.

#### Assinatura

- `shutdown(): Promise<void>`