:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/api/telemetry/telemetry)을 참조하세요.
:::

# Telemetry

## 개요

`Telemetry`는 NocoBase의 원격 측정 모듈로, <a href="https://opentelemetry.io">OpenTelemetry</a>를 기반으로 캡슐화되어 있습니다. OpenTelemetry 생태계의 메트릭(Metric) 및 트레이스(Trace) 도구 등록을 지원합니다.

## 클래스 메서드

### `constructor()`

생성자 함수로, `Telemetry` 인스턴스를 생성합니다.

#### 시그니처

- `constructor(options?: TelemetryOptions)`

#### 타입

```ts
export interface TelemetryOptions {
  serviceName?: string;
  version?: string;
  trace?: TraceOptions;
  metric?: MetricOptions;
}
```

#### 상세 정보

| 속성          | 타입            | 설명                                                                                                                        | 기본값                     |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `serviceName` | `string`        | 선택 사항, <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a>을 참고하세요. | `nocobase`                 |
| `version`     | `string`        | 선택 사항, <a href="https://opentelemetry.io/docs/specs/semconv/resource/#service" target="_blank">Semantic Conventions</a>을 참고하세요. | 선택 사항, 현재 NocoBase 버전 번호 |
| `trace`       | `TraceOptions`  | 선택 사항, [Trace](./trace.md)를 참고하세요.                                                                                              | - |
| `metric`      | `MetricOptions` | 선택 사항, [Metric](./metric.md)를 참고하세요.                                                                                             | - |

### `init()`

Instrumentation을 등록하고 `Trace`, `Metric`을 초기화합니다.

#### 시그니처

- `init(): void`

### `start()`

Prometheus로의 내보내기 등 `Trace` 및 `Metric` 관련 데이터 처리 프로그램을 시작합니다.

#### 시그니처

- `start(): void`

### `shutdown()`

`Trace` 및 `Metric` 관련 데이터 처리 프로그램을 중지합니다.

#### 시그니처

- `shutdown(): Promise<void>`

### `addInstrumentation()`

인스트루멘테이션(Instrumentation) 라이브러리를 추가합니다.

#### 시그니처

- `addInstrumentation(...instrumentation: InstrumentationOption[])`