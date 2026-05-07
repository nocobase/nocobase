:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/api/telemetry/telemetry).
:::

# Telemetria

## Visão Geral

`Telemetry` é o módulo de telemetria do NocoBase, baseado no <a href="https://opentelemetry.io">OpenTelemetry</a>, com suporte para registro de métricas (Metric) e rastreamento (Trace) dentro do ecossistema OpenTelemetry.

## Métodos da Classe

### `constructor()`

Construtor para criar uma instância de `Telemetry`.

#### Assinatura

- `constructor(options?: TelemetryOptions)`

#### Tipo

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### Detalhes

| Propriedade   | Tipo            | Descrição                                                                                                                   | Valor Padrão               |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | Opcional, consulte as <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                 |
| `version`     | `string`        | Opcional, consulte as <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Opcional, versão atual do NocoBase |
| `trace`       | `TraceOptions`  | Opcional, consulte [Trace](./trace.md)                                                                                      | -                          |
| `metric`      | `MetricOptions` | Opcional, consulte [Metric](./metric.md)                                                                                    | -                          |

### `init()`

Registra a instrumentação e inicializa `Trace` e `Metric`.

#### Assinatura

- `init(): void`

### `start()`

Inicia o processamento de dados relacionados a `Trace` e `Metric`, como a exportação para o Prometheus.

#### Assinatura

- `start(): void`

### `shutdown()`

Interrompe o processamento de dados relacionados a `Trace` e `Metric`.

#### Assinatura

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Adiciona bibliotecas de instrumentação.

#### Assinatura

- `addInstrumentation(...instrumentation: InstrumentationOption[])`