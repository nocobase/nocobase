:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/api/telemetry/metric) bakın.
:::

# Metric

## Sınıf Yöntemleri

### `constructor()`

Bir `Metric` örneği oluşturmak için kullanılan kurucu yöntem (constructor).

#### İmza

- `constructor(options?: MetricOptions)`

#### Tip

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### Detaylar

| Özellik      | Tip                    | Açıklama                                          | Varsayılan Değer            |
| ------------ | ---------------------- | ------------------------------------------------- | --------------------------- |
| `meterName`  | `string`               | Meter tanımlayıcısı                               | `nocobase-meter`            |
| `version`    | `string`               |                                                   | NocoBase'in mevcut sürüm numarası |
| `readerName` | `string` \| `string[]` | Kullanılmak istenen kayıtlı `MetricReader` tanımlayıcıları | -                           |

### `init()`

`MetricProvider`'ı başlatır.

#### İmza

- `init(): void`

### `registerReader()`

Bir `MetricReader` kaydeder.

#### İmza

- `registerReader(name: string, reader: GetMetricReader)`

#### Tip

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### Detaylar

| Parametre | Tip                  | Açıklama                             |
| --------- | -------------------- | ------------------------------------ |
| `name`    | `string`             | `MetricReader` için benzersiz tanımlayıcı |
| `reader`  | `() => MetricReader` | `MetricReader` almak için kullanılan fonksiyon |

### `addView()`

Bir `View` ekler. Bakınız: [Configure Metric Views](https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views).

#### İmza

- `addView(...view: View[])`

#### Tip

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

`Meter` nesnesini alır.

#### İmza

- `getMeter(name?: string, version?: string)`

#### Detaylar

| Parametre | Tip      | Açıklama         | Varsayılan Değer            |
| --------- | -------- | ---------------- | --------------------------- |
| `name`    | `string` | Meter tanımlayıcısı | `nocobase-meter`            |
| `version` | `string` |                  | NocoBase'in mevcut sürüm numarası |

### `start()`

`MetricReader`'ı başlatır.

#### İmza

- `start(): void`

### `shutdown()`

`MetricReader`'ı durdurur.

#### İmza

- `shutdown(): Promise<void>`