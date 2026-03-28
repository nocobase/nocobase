:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/flow-engine/flow-context)을 참조하세요.
:::

# 컨텍스트 체계 개요

NocoBase 워크플로우 엔진의 컨텍스트 체계는 세 가지 계층으로 나뉘며, 각각 서로 다른 스코프에 대응합니다. 이를 합리적으로 사용하면 서비스, 설정, 데이터의 유연한 공유와 격리를 실현하여 비즈니스 유지보수성과 확장성을 향상시킬 수 있습니다.

- **FlowEngineContext(글로벌 컨텍스트)**: 전역적으로 유일하며, 모든 모델과 워크플로우가 접근할 수 있습니다. 글로벌 서비스, 설정 등을 등록하는 데 적합합니다.
- **FlowModelContext(모델 컨텍스트)**: 모델 트리 내부의 컨텍스트 공유에 사용됩니다. 자식 모델은 부모 모델 컨텍스트를 자동으로 대리(delegate)하며, 동일 이름 덮어쓰기를 지원합니다. 모델 수준의 로직과 데이터 격리에 적합합니다.
- **FlowRuntimeContext(워크플로우 런타임 컨텍스트)**: 워크플로우가 실행될 때마다 생성되어 전체 워크플로우 실행 주기에 걸쳐 유지됩니다. 워크플로우 내 데이터 전달, 변수 저장, 실행 상태 기록 등에 적합합니다. `mode: 'runtime' | 'settings'`의 두 가지 모드를 지원하며, 각각 실행 상태와 설정 상태에 대응합니다.

모든 `FlowEngineContext`(글로벌 컨텍스트), `FlowModelContext`(모델 컨텍스트), `FlowRuntimeContext`(워크플로우 런타임 컨텍스트) 등은 `FlowContext`의 서브클래스 또는 인스턴스입니다.

---

## 🗂️ 계층 구조도

```text
FlowEngineContext (글로벌 컨텍스트)
│
├── FlowModelContext (모델 컨텍스트)
│     ├── 자식 FlowModelContext (자식 모델)
│     │     ├── FlowRuntimeContext (워크플로우 런타임 컨텍스트)
│     │     └── FlowRuntimeContext (워크플로우 런타임 컨텍스트)
│     └── FlowRuntimeContext (워크플로우 런타임 컨텍스트)
│
├── FlowModelContext (모델 컨텍스트)
│     └── FlowRuntimeContext (워크플로우 런타임 컨텍스트)
│
└── FlowModelContext (모델 컨텍스트)
      ├── 자식 FlowModelContext (자식 모델)
      │     └── FlowRuntimeContext (워크플로우 런타임 컨텍스트)
      └── FlowRuntimeContext (워크플로우 런타임 컨텍스트)
```

- `FlowModelContext`는 대리(delegate) 메커니즘을 통해 `FlowEngineContext`의 속성과 메서드에 접근할 수 있어 글로벌 능력 공유를 실현합니다.
- 자식 모델의 `FlowModelContext`는 대리(delegate) 메커니즘을 통해 부모 모델의 컨텍스트(동기 관계)에 접근할 수 있으며, 동일 이름 덮어쓰기를 지원합니다.
- 비동기 부모-자식 모델은 상태 오염을 방지하기 위해 대리(delegate) 관계를 맺지 않습니다.
- `FlowRuntimeContext`는 항상 대리(delegate) 메커니즘을 통해 대응하는 `FlowModelContext`에 접근하지만, 상위로 역전달되지는 않습니다.

---

## 🧭 실행 상태와 설정 상태 (mode)

`FlowRuntimeContext`는 `mode` 파라미터를 통해 구분되는 두 가지 모드를 지원합니다.

- `mode: 'runtime'`(실행 상태): 워크플로우의 실제 실행 단계에서 사용되며, 속성과 메서드는 실제 데이터를 반환합니다. 예:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'`(설정 상태): 워크플로우 설계 및 설정 단계에서 사용되며, 속성 접근 시 변수 템플릿 문자열을 반환하여 표현식과 변수 선택을 용이하게 합니다. 예:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

이러한 이중 모드 설계는 런타임 시의 데이터 가용성을 보장할 뿐만 아니라, 설정 시의 변수 참조와 표현식 생성을 편리하게 하여 워크플로우 엔진의 유연성과 사용 편의성을 높여줍니다.

---

## 🤖 도구/대규모 언어 모델(LLM)을 위한 컨텍스트 정보

특정 시나리오(예: JS*Model의 RunJS 코드 편집, AI 코딩)에서는 "호출자"가 코드를 실행하지 않고도 다음 사항을 파악해야 합니다.

- 현재 `ctx` 아래에 어떤 **정적 능력**(API 문서, 파라미터, 예시, 문서 링크 등)이 있는지
- 현재 인터페이스/실행 상태에 어떤 **선택 가능한 변수**(예: "현재 레코드", "현재 팝업 레코드" 등 동적 구조)가 있는지
- 현재 실행 환경의 **소용량 스냅샷**(프롬프트용)

### 1) `await ctx.getApiInfos(options?)` (정적 API 정보)

### 2) `await ctx.getVarInfos(options?)` (변수 구조 정보)

- `defineProperty(...).meta`(meta factory 포함)를 기반으로 변수 구조 구축
- `path` 자르기와 `maxDepth` 깊이 제어 지원
- 필요한 경우에만 하위로 확장

상용 파라미터:

- `maxDepth`: 최대 확장 계층 (기본값 3)
- `path: string | string[]`: 자르기, 지정된 경로의 하위 트리만 출력

### 3) `await ctx.getEnvInfos()` (런타임 환경 스냅샷)

노드 구조 (간략화):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // await ctx.getVar(getVar)에 직접 사용 가능, "ctx."으로 시작
  value?: any; // 해석 완료/직렬화 가능한 정적 값
  properties?: Record<string, EnvNode>;
};
```