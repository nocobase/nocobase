:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/api/telemetry/trace).
:::

# Trace

## Metode Kelas

### `constructor()`

Konstruktor untuk membuat instans `Trace`.

#### Tanda Tangan

- `constructor(options?: TraceOptions)`

#### Tipe

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### Detail

| Properti        | Tipe                   | Deskripsi                                               | Nilai Default               |
| --------------- | ---------------------- | ------------------------------------------------------- | --------------------------- |
| `tracerName`    | `string`               | Pengidentifikasi trace                                  | `nocobase-trace`            |
| `version`       | `string`               |                                                         | Versi NocoBase saat ini     |
| `processorName` | `string` \| `string[]` | Pengidentifikasi `SpanProcessor` terdaftar yang ingin diaktifkan |                             |

### `init()`

Menginisialisasi `NodeTracerProvider`.

#### Tanda Tangan

- `init(): void`

### `registerProcessor()`

Mendaftarkan `SpanProcessor`.

#### Tanda Tangan

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Tipe

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Detail

| Parameter   | Tipe                  | Deskripsi                             |
| ----------- | --------------------- | ------------------------------------- |
| `name`      | `string`              | Pengidentifikasi unik `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Metode untuk mendapatkan `SpanProcessor` |

### `getTracer()`

Mendapatkan `Tracer`.

#### Tanda Tangan

- `getTracer(name?: string, version?: string)`

#### Detail

| Parameter | Tipe     | Deskripsi              | Nilai Default               |
| --------- | -------- | ---------------------- | --------------------------- |
| `name`    | `string` | Pengidentifikasi trace | `nocobase-trace`            |
| `version` | `string` |                        | Versi NocoBase saat ini     |

### `start()`

Memulai `SpanProcessor`.

#### Tanda Tangan

- `start(): void`

### `shutdown()`

Menghentikan `SpanProcessor`.

#### Tanda Tangan

- `shutdown(): Promise<void>`