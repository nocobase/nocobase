:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/api/telemetry/metric).
:::

# Metric

## Métodos de clase

### `constructor()`

Constructor para crear una instancia de `Metric`.

#### Firma

- `constructor(options?: MetricOptions)`

#### Tipo

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Detalles

| Propiedad    | Tipo                   | Descripción                                           | Valor por defecto           |
| ------------ | ---------------------- | ----------------------------------------------------- | --------------------------- |
| `meterName`  | `string`               | Identificador del meter                               | `nocobase-meter`            |
| `version`    | `string`               |                                                       | Versión actual de NocoBase  |
| `readerName` | `string` \| `string[]` | Identificador(es) de los `MetricReader` registrados que se desean habilitar |                             |

### `init()`

Inicializa `MetricProvider`.

#### Firma

- `init(): void`

### `registerReader()`

Registra un `MetricReader`.

#### Firma

- `registerReader(name: string, reader: GetMetricReader)`

#### Tipo

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Detalles

| Parámetro   | Tipo                 | Descripción                          |
| ----------- | -------------------- | ------------------------------------ |
| `name`      | `string`             | Identificador único para `MetricReader` |
| `reader`    | `() => MetricReader` | Método para obtener el `MetricReader` |

### `addView()`

Añade una `View`. Consulte <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>.

#### Firma

- `addView(...view: View[])`

#### Tipo

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Obtiene el `Meter`.

#### Firma

- `getMeter(name?: string, version?: string)`

#### Detalles

| Parámetro | Tipo     | Descripción             | Valor por defecto           |
| --------- | -------- | ----------------------- | --------------------------- |
| `name`    | `string` | Identificador del meter | `nocobase-meter`            |
| `version` | `string` |                         | Versión actual de NocoBase  |

### `start()`

Inicia el `MetricReader`.

#### Firma

- `start(): void`

### `shutdown()`

Detiene el `MetricReader`.

#### Firma

- `shutdown(): Promise<void>`