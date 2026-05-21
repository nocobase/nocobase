---
title: "Trace"
description: "API trace NocoBase: method class Trace, distributed tracing."
keywords: "Trace,API trace,distributed tracing,Telemetry,NocoBase"
---

# Trace

## Method Class

### `constructor()`

Constructor, membuat instance `Trace`.

#### Signature

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

| Properti | Tipe | Deskripsi | Default |
| --------------- | ---------------------- | --------------------------------------- | ------------------- |
| `traceName` | `string` | Identifier trace | `nocobase-trace` |
| `version` | `string` | | Nomor versi NocoBase saat ini |
| `processorName` | `string` \| `string[]` | Identifier `SpanProcessor` terdaftar yang ingin diaktifkan | |

### `init()`

Menginisialisasi `NodeTracerProvider`.

#### Signature

- `init(): void`

### `registerProcessor()`

Mendaftarkan `SpanProcessor`

#### Signature

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Tipe

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Detail

| Parameter | Tipe | Deskripsi |
| ----------- | --------------------- | --------------------------- |
| `name` | `string` | Identifier unik `SpanProcessor` |
| `processor` | `() => SpanProcessor` | Method untuk mendapatkan `SpanProcessor` |

### `getTracer()`

Mendapatkan `Tracer`.

#### Signature

- `getTracer(name?: string, version?: string)`

#### Detail

| Parameter | Tipe | Deskripsi | Default |
| --------- | -------- | ---------- | ------------------- |
| `name` | `string` | Identifier trace | `nocobase-trace` |
| `version` | `string` | | Nomor versi NocoBase saat ini |

### `start()`

Memulai `SpanProcessor`.

#### Signature

- `start(): void`

### `shutdown()`

Menghentikan `SpanProcessor`.

#### Signature

- `shutdown(): Promise<void>`
