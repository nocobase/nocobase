:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/api/telemetry/trace) bakın.
:::

# Trace

## Sınıf Metotları

### `constructor()`

Bir `Trace` örneği oluşturan yapıcı metot.

#### İmza

- `constructor(options?: TraceOptions)`

#### Tip

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### Ayrıntılar

| Özellik         | Tip                    | Açıklama                                         | Varsayılan Değer            |
| --------------- | ---------------------- | ------------------------------------------------ | --------------------------- |
| `tracerName`    | `string`               | Trace tanımlayıcısı                              | `nocobase-trace`            |
| `version`       | `string`               |                                                  | Mevcut NocoBase sürüm numarası |
| `processorName` | `string` \| `string[]` | Kullanılmak istenen kayıtlı `SpanProcessor` tanımlayıcıları |                             |

### `init()`

`NodeTracerProvider`ı başlatır.

#### İmza

- `init(): void`

### `registerProcessor()`

Bir `SpanProcessor` kaydeder.

#### İmza

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### Tip

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### Ayrıntılar

| Parametre   | Tip                   | Açıklama                               |
| ----------- | --------------------- | -------------------------------------- |
| `name`      | `string`              | `SpanProcessor` için benzersiz tanımlayıcı |
| `processor` | `() => SpanProcessor` | `SpanProcessor`ı almak için kullanılan metot |

### `getTracer()`

`Tracer`ı alır.

#### İmza

- `getTracer(name?: string, version?: string)`

#### Ayrıntılar

| Parametre | Tip      | Açıklama           | Varsayılan Değer            |
| --------- | -------- | ------------------ | --------------------------- |
| `name`    | `string` | Trace tanımlayıcısı | `nocobase-trace`            |
| `version` | `string` |                    | Mevcut NocoBase sürüm numarası |

### `start()`

`SpanProcessor`ı başlatır.

#### İmza

- `start(): void`

### `shutdown()`

`SpanProcessor`ı durdurur.

#### İmza

- `shutdown(): Promise<void>`