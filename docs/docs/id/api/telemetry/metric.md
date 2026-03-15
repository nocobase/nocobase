:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/api/telemetry/metric).
:::

# Metric

## Metode Class

### `constructor()`

Konstruktor untuk membuat instance `Metric`.

#### Signature

- `constructor(options?: MetricOptions)`

#### Tipe

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Detail

| Properti     | Tipe                   | Deskripsi                                             | Nilai Default               |
| ------------ | ---------------------- | ----------------------------------------------------- | --------------------------- |
| `meterName`  | `string`               | Identifikasi meter                                    | `nocobase-meter`            |
| `version`    | `string`               |                                                       | Versi NocoBase saat ini     |
| `readerName` | `string` \| `string[]` | Identifikasi `MetricReader` terdaftar yang akan digunakan | -                           |

### `init()`

Menginisialisasi `MetricProvider`.

#### Signature

- `init(): void`

### `registerReader()`

Mendaftarkan `MetricReader`.

#### Signature

- `registerReader(name: string, reader: GetMetricReader)`

#### Tipe

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Detail

| Parameter | Tipe                 | Deskripsi                             |
| --------- | -------------------- | ------------------------------------- |
| `name`    | `string`             | Identifikasi unik untuk `MetricReader` |
| `reader`  | `() => MetricReader` | Metode untuk mendapatkan `MetricReader` |

### `addView()`

Menambahkan `View`. Lihat <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>.

#### Signature

- `addView(...view: View[])`

#### Tipe

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

Mendapatkan `Meter`.

#### Signature

- `getMeter(name?: string, version?: string)`

#### Detail

| Parameter | Tipe     | Deskripsi          | Nilai Default               |
| --------- | -------- | ------------------ | --------------------------- |
| `name`    | `string` | Identifikasi meter | `nocobase-meter`            |
| `version` | `string` |                    | Versi NocoBase saat ini     |

### `start()`

Memulai `MetricReader`.

#### Signature

- `start(): void`

### `shutdown()`

Menghentikan `MetricReader`.

#### Signature

- `shutdown(): Promise<void>`