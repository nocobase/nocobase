:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/api/telemetry/telemetry).
:::

# Telemetry

## Ikhtisar

`Telemetry` adalah modul telemetri NocoBase, yang berbasis pada <a href="https://opentelemetry.io">OpenTelemetry</a>, mendukung pendaftaran alat metrik (Metric) dan pelacakan (Trace) dalam ekosistem OpenTelemetry.

## Metode Kelas

### `constructor()`

Konstruktor untuk membuat instansi `Telemetry`.

#### Signature

- `constructor(options?: TelemetryOptions)`

#### Tipe

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### Detail

| Properti      | Tipe            | Deskripsi                                                                                                                   | Nilai Default              |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | Opsional, merujuk pada <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | `nocobase`                 |
| `version`     | `string`        | Opsional, merujuk pada <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a> | Opsional, nomor versi NocoBase saat ini |
| `trace`       | `TraceOptions`  | Opsional, merujuk pada [Trace](./trace.md)                                                                                  | -                          |
| `metric`      | `MetricOptions` | Opsional, merujuk pada [Metric](./metric.md)                                                                                 | -                          |

### `init()`

Mendaftarkan instrumentasi, menginisialisasi `Trace` dan `Metric`.

#### Signature

- `init(): void`

### `start()`

Memulai pemrosesan data terkait `Trace` dan `Metric`, seperti mengekspor ke Prometheus.

#### Signature

- `start(): void`

### `shutdown()`

Menghentikan pemrosesan data terkait `Trace` dan `Metric`.

#### Signature

- `shutdown(): Promise<void>`

### `addInstrumentation()`

Menambahkan pustaka instrumentasi.

#### Signature

- `addInstrumentation(...instrumentation: InstrumentationOption[])`