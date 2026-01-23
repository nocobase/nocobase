
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 컨텍스트 시스템 개요

NocoBase 워크플로우 엔진의 컨텍스트 시스템은 세 가지 계층으로 나뉘며, 각 계층은 서로 다른 스코프(scope)에 해당합니다. 이를 적절히 사용하면 서비스, 설정, 데이터를 유연하게 공유하고 격리하여 비즈니스 유지보수성과 확장성을 향상시킬 수 있습니다.

- **FlowEngineContext (글로벌 컨텍스트)**: 전역적으로 유일하며, 모든 모델과 워크플로우에서 접근할 수 있습니다. 글로벌 서비스나 설정을 등록하는 데 적합합니다.
- **FlowModelContext (모델 컨텍스트)**: 모델 트리 내부에서 컨텍스트를 공유하는 데 사용됩니다. 자식 모델은 부모 모델의 컨텍스트를 자동으로 위임받으며, 동일한 이름으로 덮어쓰기를 지원합니다. 모델 수준의 로직과 데이터 격리에 적합합니다.
- **FlowRuntimeContext (워크플로우 런타임 컨텍스트)**: 워크플로우가 실행될 때마다 생성되며, 전체 워크플로우 실행 주기 동안 유지됩니다. 워크플로우 내에서 데이터 전달, 변수 저장, 실행 상태 기록 등에 적합합니다. `mode: 'runtime' | 'settings'` 두 가지 모드를 지원하며, 각각 런타임 모드와 설정 모드에 해당합니다.

모든 `FlowEngineContext` (글로벌 컨텍스트), `FlowModelContext` (모델 컨텍스트), `FlowRuntimeContext` (워크플로우 런타임 컨텍스트) 등은 `FlowContext`의 서브클래스(subclass) 또는 인스턴스(instance)입니다.

---

## 🗂️ 계층 구조 다이어그램

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

- `FlowModelContext`는 위임(delegate) 메커니즘을 통해 `FlowEngineContext`의 속성과 메서드에 접근할 수 있으며, 이를 통해 글로벌 기능을 공유할 수 있습니다.
- 자식 모델의 `FlowModelContext`는 위임(delegate) 메커니즘을 통해 부모 모델의 컨텍스트(동기 관계)에 접근할 수 있으며, 동일한 이름으로 덮어쓰기를 지원합니다.
- 비동기 부모-자식 모델은 상태 오염을 방지하기 위해 위임(delegate) 관계를 설정하지 않습니다.
- `FlowRuntimeContext`는 항상 위임(delegate) 메커니즘을 통해 해당 `FlowModelContext`에 접근하지만, 상위로 변경 사항을 전파하지는 않습니다.

## 🧭 런타임 모드와 설정 모드 (mode)

`FlowRuntimeContext`는 두 가지 모드를 지원하며, `mode` 매개변수로 구분됩니다.

- `mode: 'runtime'` (런타임 모드): 워크플로우의 실제 실행 단계에서 사용됩니다. 속성과 메서드는 실제 데이터를 반환합니다. 예시:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (설정 모드): 워크플로우 설계 및 설정 단계에서 사용됩니다. 속성 접근 시 변수 템플릿 문자열을 반환하여 표현식 및 변수 선택을 용이하게 합니다. 예시:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

이러한 이중 모드 설계는 런타임 시 데이터 가용성을 보장할 뿐만 아니라, 설정 시 변수 참조 및 표현식 생성을 용이하게 하여 워크플로우 엔진의 유연성과 사용 편의성을 향상시킵니다.