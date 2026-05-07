:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/api/telemetry/metric).
:::

# Metric

## Métodos da classe

### `constructor()`

Construtor para criar uma instância de `Metric`.

#### Assinatura

- `constructor(options?: MetricOptions)`

#### Tipo

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Detalhes

| Propriedade  | Tipo                   | Descrição                                         | Valor padrão                |
| ------------ | ---------------------- | ------------------------------------------------- | --------------------------- |
| `meterName`  | `string`               | Identificador do meter                            | `nocobase-meter`            |
| `version`    | `string`               |                                                   | Versão atual do NocoBase    |
| `readerName` | `string` \| `string[]` | Identificador(es) do `MetricReader` registrado para usar |                             |

### `init()`

Inicializa o `MetricProvider`.

#### Assinatura

- `init(): void`

### `registerReader()`

Registra um `MetricReader`.

#### Assinatura

- `registerReader(name: string, reader: GetMetricReader)`

#### Tipo

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Detalhes

| Parâmetro   | Tipo                 | Descrição                            |
| ----------- | -------------------- | ------------------------------------ |
| `name`      | `string`             | Identificador único do `MetricReader` |
| `processor` | `() => MetricReader` | Função para obter o `MetricReader`   |

### `addView()`

Adiciona uma `View`. Consulte <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>.

#### Assinatura

- `addView(...view: View[])`

#### Tipo

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Obtém o `Meter`.

#### Assinatura

- `getMeter(name?: string, version?: string)`

#### Detalhes

| Parâmetro | Tipo     | Descrição              | Valor padrão             |
| --------- | -------- | ---------------------- | ------------------------ |
| `name`    | `string` | Identificador do meter | `nocobase-meter`         |
| `version` | `string` |                        | Versão atual do NocoBase |

### `start()`

Inicia o `MetricReader`.

#### Assinatura

- `start(): void`

### `shutdown()`

Para o `MetricReader`.

#### Assinatura

- `shutdown(): Promise<void>`