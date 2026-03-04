:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/api/telemetry/telemetry) bakın.
:::

# Telemetry

## Genel Bakış

`Telemetry`, NocoBase'in telemetri modülüdür. <a href="https://opentelemetry.io">OpenTelemetry</a> tabanlıdır ve OpenTelemetry ekosistemindeki metrik (Metric) ve izleme (Trace) araçlarının kaydedilmesini destekler.

## Sınıf Metotları

### `constructor()`

Bir `Telemetry` örneği oluşturan yapıcı metot.

#### İmza

- `constructor(options?: TelemetryOptions)`

#### Tip

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### Detaylar

| Özellik       | Tip             | Açıklama                                                                                                                    | Varsayılan Değer           |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | İsteğe bağlı, <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> belgesine bakın | `nocobase`                 |
| `version`     | `string`        | İsteğe bağlı, <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> belgesine bakın | Mevcut NocoBase sürüm numarası |
| `trace`       | `TraceOptions`  | İsteğe bağlı, [Trace](./trace.md) belgesine bakın                                                                           | -                          |
| `metric`      | `MetricOptions` | İsteğe bağlı, [Metric](./metric.md) belgesine bakın                                                                         | -                          |

### `init()`

Enstrümantasyonu (Instrumentation) kaydeder, `Trace` ve `Metric` yapılarını başlatır.

#### İmza

- `init(): void`

### `start()`

`Trace` ve `Metric` ile ilgili veri işleme süreçlerini başlatır; örneğin verilerin Prometheus'a aktarılması gibi.

#### İmza

- `start(): void`

### `shutdown()`

`Trace` ve `Metric` ile ilgili veri işleme süreçlerini durdurur.

#### İmza

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Enstrümantasyon kitaplıklarını ekler.

#### İmza

- `addInstrumentation(...instrumentation: InstrumentationOption[])`