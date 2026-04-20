:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/logger)을 참조하세요.
:::

# ctx.logger

[pino](https://github.com/pinojs/pino) 기반의 로그 캡슐화로, 고성능 구조화된 JSON 로그를 제공합니다. 로그 수집 및 분석을 용이하게 하기 위해 `console` 대신 `ctx.logger`를 사용하는 것을 권장합니다.

## 적용 시나리오

모든 RunJS 시나리오에서 `ctx.logger`를 사용할 수 있으며, 디버깅, 오류 추적, 성능 분석 등에 활용됩니다.

## 타입 정의

```ts
logger: pino.Logger;
```

`ctx.logger`는 `engine.logger.child({ module: 'flow-engine' })`의 인스턴스로, `module` 컨텍스트가 포함된 pino 자식(child) 로거입니다.

## 로그 레벨

pino는 다음 레벨을 지원합니다 (높은 순에서 낮은 순):

| 레벨 | 메서드 | 설명 |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | 치명적 오류, 보통 프로세스 종료로 이어짐 |
| `error` | `ctx.logger.error()` | 오류, 요청 또는 작업 실패를 나타냄 |
| `warn` | `ctx.logger.warn()` | 경고, 잠재적 위험이나 비정상적인 상황을 나타냄 |
| `info` | `ctx.logger.info()` | 일반적인 런타임 정보 |
| `debug` | `ctx.logger.debug()` | 디버깅 정보, 개발 시 사용 |
| `trace` | `ctx.logger.trace()` | 상세 추적, 심층 진단 시 사용 |

## 권장 작성 방식

`level(msg, meta)` 형식을 권장합니다: 메시지가 먼저 오고, 선택 사항인 메타데이터 객체가 뒤에 옵니다.

```ts
ctx.logger.info('블록 로드 완료');
ctx.logger.info('작업 성공', { recordId: 456 });
ctx.logger.warn('성능 경고', { duration: 5000 });
ctx.logger.error('작업 실패', { userId: 123, action: 'create' });
ctx.logger.error('요청 실패', { err });
```

pino는 `level(meta, msg)` (객체가 먼저 옴) 또는 `level({ msg, ...meta })` (단일 객체) 형식도 지원하므로 필요에 따라 사용할 수 있습니다.

## 예시

### 기본 사용법

```ts
ctx.logger.info('블록 로드 완료');
ctx.logger.warn('요청 실패, 캐시 사용', { err });
ctx.logger.debug('저장 중', { recordId: ctx.record?.id });
```

### child()를 사용하여 자식 로거 생성

```ts
// 현재 로직을 위해 컨텍스트가 포함된 자식 로거 생성
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('1단계 실행');
log.debug('2단계 실행', { step: 2 });
```

### console과의 관계

구조화된 JSON 로그를 얻기 위해 `ctx.logger`를 직접 사용하는 것을 권장합니다. `console` 사용이 익숙하다면 다음과 같이 대응됩니다: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## 로그 형식

pino는 구조화된 JSON을 출력하며, 각 로그 항목에는 다음이 포함됩니다:

- `level`: 로그 레벨 (숫자)
- `time`: 타임스탬프 (밀리초)
- `msg`: 로그 메시지
- `module`: `flow-engine`으로 고정
- 기타 사용자 정의 필드 (객체를 통해 전달됨)

## 주의사항

- 로그는 구조화된 JSON 형식이므로 수집, 검색 및 분석이 용이합니다.
- `child()`를 통해 생성된 자식 로거도 `level(msg, meta)` 형식을 권장합니다.
- 일부 실행 환경(예: 워크플로우)에서는 다른 로그 출력 방식을 사용할 수 있습니다.

## 관련 정보

- [pino](https://github.com/pinojs/pino) — 하위 로그 라이브러리