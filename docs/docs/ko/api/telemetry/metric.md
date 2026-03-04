:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/api/telemetry/metric)을 참조하세요.
:::

# Metric

## 클래스 메서드

### `constructor()`

`Metric` 인스턴스를 생성하는 생성자 함수입니다.

#### 시그니처

- `constructor(options?: MetricOptions)`

#### 타입

```ts
export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};
```

#### 상세 정보

| 속성         | 타입                   | 설명                                   | 기본값              |
| ------------ | ---------------------- | -------------------------------------- | ------------------- |
| `meterName`  | `string`               | meter 식별자                             | `nocobase-meter`    |
| `version`    | `string`               |                                        | NocoBase 현재 버전 번호 |
| `readerName` | `string` \| `string[]` | 활성화하려는 등록된 `MetricReader`의 식별자 |                     |

### `init()`

`MetricProvider`를 초기화합니다.

#### 시그니처

- `init(): void`

### `registerReader()`

`MetricReader`를 등록합니다.

#### 시그니처

- `registerReader(name: string, reader: GetMetricReader)`

#### 타입

```ts
import { MetricReader } from '@opentelemetry/sdk-metrics';

type GetMetricReader = () => MetricReader;
```

#### 상세 정보

| 매개변수    | 타입                 | 설명                       |
| ----------- | -------------------- | -------------------------- |
| `name`      | `string`             | `MetricReader` 고유 식별자    |
| `processor` | `() => MetricReader` | `MetricReader`를 가져오는 메서드 |

### `addView()`

`View`를 추가합니다. <a href="https://opentelemetry.io/docs/instrumentation/js/manual/#configure-metric-views" target="_blank">Configure Metric Views</a>를 참고하세요.

#### 시그니처

- `addView(...view: View[])`

#### 타입

```ts
import { View } from '@opentelemetry/sdk-metrics';
```

### `getMeter()`

`Meter`를 가져옵니다.

#### 시그니처

- `getMeter(name?: string, version?: string)`

#### 상세 정보

| 매개변수   | 타입     | 설명       | 기본값              |
| --------- | -------- | ---------- | ------------------- |
| `name`    | `string` | meter 식별자 | `nocobase-meter`    |
| `version` | `string` |            | NocoBase 현재 버전 번호 |

### `start()`

`MetricReader`를 시작합니다.

#### 시그니처

- `start(): void`

### `shutdown()`

`MetricReader`를 중지합니다.

#### 시그니처

- `shutdown(): Promise<void>`