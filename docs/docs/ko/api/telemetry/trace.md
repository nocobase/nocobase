:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/api/telemetry/trace)을 참조하세요.
:::

# Trace

## 클래스 메서드

### `constructor()`

`Trace` 인스턴스를 생성하는 생성자 함수입니다.

#### 시그니처

- `constructor(options?: TraceOptions)`

#### 타입

```ts
export type TraceOptions = {
  tracerName?: string;
  version?: string;
  processorName?: string | string[];
};
```

#### 상세 정보

| 속성 | 타입 | 설명 | 기본값 |
| --------------- | ---------------------- | --------------------------------------- | ------------------- |
| `tracerName` | `string` | Trace 식별자 | `nocobase-trace` |
| `version` | `string` | | NocoBase 현재 버전 번호 |
| `processorName` | `string` \| `string[]` | 활성화하려는 등록된 `SpanProcessor`의 식별자 | |

### `init()`

`NodeTracerProvider`를 초기화합니다.

#### 시그니처

- `init(): void`

### `registerProcessor()`

`SpanProcessor`를 등록합니다.

#### 시그니처

- `registerProcessor(name: string, processor: GetSpanProcessor)`

#### 타입

```ts
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';

type GetSpanProcessor = () => SpanProcessor;
```

#### 상세 정보

| 매개변수 | 타입 | 설명 |
| ----------- | --------------------- | --------------------------- |
| `name` | `string` | `SpanProcessor` 고유 식별자 |
| `processor` | `() => SpanProcessor` | `SpanProcessor`를 가져오는 메서드 |

### `getTracer()`

`Tracer`를 가져옵니다.

#### 시그니처

- `getTracer(name?: string, version?: string)`

#### 상세 정보

| 매개변수 | 타입 | 설명 | 기본값 |
| --------- | -------- | ---------- | ------------------- |
| `name` | `string` | Trace 식별자 | `nocobase-trace` |
| `version` | `string` | | NocoBase 현재 버전 번호 |

### `start()`

`SpanProcessor`를 시작합니다.

#### 시그니처

- `start(): void`

### `shutdown()`

`SpanProcessor`를 중지합니다.

#### 시그니처

- `shutdown(): Promise<void>`