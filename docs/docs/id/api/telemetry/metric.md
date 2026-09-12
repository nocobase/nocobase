---
title: "Metric"
description: "API metric NocoBase: method class Metric, pencatatan metric."
keywords: "Metric,API metric,pencatatan metric,Telemetry,NocoBase"
---

# Metric

## Method Class

### `constructor()`

Constructor, membuat instance `Metric`.

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

| Properti | Tipe | Deskripsi | Default |
| ------------ | ---------------------- | -------------------------------------- | ------------------- |
| `meterName` | `string` | Identifier meter | `nocobase-meter` |
| `version` | `string` | | Nomor versi NocoBase saat ini |
| `readerName` | `string` \| `string[]` | Identifier `MetricReader` terdaftar yang ingin diaktifkan | |

### `init()`

Menginisialisasi `MetricProvider`.

#### Signature

- `init(): void`

### `registerReader()`

Mendaftarkan `MetricReader`

#### Signature

- `registerReader(name: string, reader: GetMetricReader)`

#### Tipe

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Detail

| Parameter | Tipe | Deskripsi |
| ----------- | -------------------- | -------------------------- |
| `name` | `string` | Identifier unik `MetricReader` |
| `processor` | `() => MetricReader` | Method untuk mendapatkan `MetricReader` |

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

| Parameter | Tipe | Deskripsi | Default |
| --------- | -------- | ---------- | ------------------- |
| `name` | `string` | Identifier meter | `nocobase-meter` |
| `version` | `string` | | Nomor versi NocoBase saat ini |

### `start()`

Memulai `MetricReader`.

#### Signature

- `start(): void`

### `shutdown()`

Menghentikan `MetricReader`.

#### Signature

- `shutdown(): Promise<void>`
