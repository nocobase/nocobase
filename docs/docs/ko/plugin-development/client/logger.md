:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 로거

NocoBase는 [pino](https://github.com/pinojs/pino) 기반의 고성능 로깅 시스템을 제공합니다. `context`에 접근할 수 있는 모든 곳에서 `ctx.logger`를 통해 로거 인스턴스를 가져와 플러그인 또는 시스템 실행 중 발생하는 중요한 로그를 기록할 수 있습니다.

## 기본 사용법

```ts
// 치명적인 오류 기록 (예: 초기화 실패)
ctx.logger.fatal('애플리케이션 초기화 실패', { error });

// 일반 오류 기록 (예: API 요청 오류)
ctx.logger.error('데이터 로딩 실패', { status, message });

// 경고 정보 기록 (예: 성능 위험 또는 사용자 작업 예외)
ctx.logger.warn('현재 폼에 저장되지 않은 변경 사항이 있습니다.');

// 일반 실행 정보 기록 (예: 컴포넌트 로드 완료)
ctx.logger.info('사용자 프로필 컴포넌트 로드 완료');

// 디버그 정보 기록 (예: 상태 변경)
ctx.logger.debug('현재 사용자 상태', { user });

// 상세 추적 정보 기록 (예: 렌더링 흐름)
ctx.logger.trace('컴포넌트 렌더링 완료', { component: 'UserProfile' });
```

이 메서드들은 다양한 로그 레벨(높은 순서부터 낮은 순서로)에 해당합니다.

| 레벨 | 메서드 | 설명 |
|------|----------|------|
| `fatal` | `ctx.logger.fatal()` | 치명적인 오류로, 일반적으로 프로그램 종료를 유발합니다. |
| `error` | `ctx.logger.error()` | 요청 또는 작업 실패를 나타내는 오류 로그입니다. |
| `warn` | `ctx.logger.warn()` | 잠재적인 위험 또는 예상치 못한 상황을 알리는 경고 정보입니다. |
| `info` | `ctx.logger.info()` | 일반적인 실행 정보입니다. |
| `debug` | `ctx.logger.debug()` | 개발 환경에서 사용되는 디버그 정보입니다. |
| `trace` | `ctx.logger.trace()` | 심층 진단에 주로 사용되는 상세 추적 정보입니다. |

## 로그 형식

모든 로그 출력은 구조화된 JSON 형식이며, 기본적으로 다음 필드를 포함합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `level` | number | 로그 레벨 |
| `time` | number | 타임스탬프 (밀리초) |
| `pid` | number | 프로세스 ID |
| `hostname` | string | 호스트 이름 |
| `msg` | string | 로그 메시지 |
| Others | object | 사용자 정의 컨텍스트 정보 |

예시 출력:

```json
{
  "level": 30,
  "time": 1730540153064,
  "pid": 12765,
  "hostname": "nocobase.local",
  "msg": "HelloModel rendered",
  "a": "a"
}
```

## 컨텍스트 바인딩

`ctx.logger`는 현재 플러그인, 모듈 또는 요청 소스와 같은 컨텍스트 정보를 자동으로 주입하여, 로그의 출처를 더 정확하게 추적할 수 있도록 합니다.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

컨텍스트를 포함한 예시 출력:

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## 사용자 정의 로거

플러그인에서 기본 설정을 상속하거나 확장하여 사용자 정의 로거 인스턴스를 생성할 수 있습니다.

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

자식 로거는 메인 로거의 설정을 상속하며 컨텍스트를 자동으로 첨부합니다.

## 로그 레벨 계층

Pino의 로그 레벨은 높은 값부터 낮은 값까지의 숫자 정의를 따르며, 숫자가 작을수록 우선순위가 낮습니다.  
다음은 전체 로그 레벨 계층표입니다.

| 레벨 이름 | 값 | 메서드 이름 | 설명 |
|-----------|--------|----------|------|
| `fatal` | 60 | `logger.fatal()` | 치명적인 오류로, 일반적으로 프로그램이 계속 실행될 수 없게 만듭니다. |
| `error` | 50 | `logger.error()` | 요청 실패 또는 작업 예외를 나타내는 일반적인 오류입니다. |
| `warn` | 40 | `logger.warn()` | 잠재적인 위험 또는 예상치 못한 상황을 알리는 경고 정보입니다. |
| `info` | 30 | `logger.info()` | 시스템 상태 또는 정상적인 작업을 기록하는 일반 정보입니다. |
| `debug` | 20 | `logger.debug()` | 개발 단계에서 문제 분석에 사용되는 디버그 정보입니다. |
| `trace` | 10 | `logger.trace()` | 심층 진단을 위한 상세 추적 정보입니다. |
| `silent` | -Infinity | (해당 메서드 없음) | 모든 로그 출력을 끕니다. |

Pino는 현재 `level` 설정보다 크거나 같은 로그만 출력합니다. 예를 들어, 로그 레벨이 `info`로 설정된 경우 `debug` 및 `trace` 로그는 무시됩니다.

## 플러그인 개발 시 모범 사례

1. **컨텍스트 로거 사용**  
   플러그인, 모델 또는 애플리케이션 컨텍스트에서 `ctx.logger`를 사용하면 소스 정보를 자동으로 포함할 수 있습니다.

2. **로그 레벨 구분**  
   - `error`를 사용하여 비즈니스 예외를 기록합니다.  
   - `info`를 사용하여 상태 변경을 기록합니다.  
   - `debug`를 사용하여 개발 디버깅 정보를 기록합니다.  

3. **과도한 로깅 피하기**  
   특히 `debug` 및 `trace` 레벨에서는 개발 환경에서만 활성화하는 것을 권장합니다.

4. **구조화된 데이터 사용**  
   문자열을 연결하는 대신 객체 매개변수를 전달하면 로그 분석 및 필터링에 도움이 됩니다.

위의 방법을 따르면 개발자는 플러그인 실행 과정을 더 효율적으로 추적하고, 문제를 해결하며, 로깅 시스템의 구조화와 확장성을 유지할 수 있습니다.