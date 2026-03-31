:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 반응형 메커니즘: Observable

:::info
NocoBase의 Observable 반응형 메커니즘은 본질적으로 [MobX](https://mobx.js.org/README.html) 와 유사합니다. 현재 내부 구현은 [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive) 를 사용하고 있으며, 문법과 개념은 [MobX](https://mobx.js.org/README.html) 와 높은 호환성을 가집니다. 단지 역사적인 이유로 [MobX](https://mobx.js.org/README.html) 를 직접 사용하지 않았을 뿐입니다.
:::

NocoBase 2.0에서는 `Observable` 반응형 객체가 모든 곳에 사용됩니다. 이는 내부 데이터 흐름과 UI 반응성의 핵심이며, FlowContext, FlowModel, FlowStep 등과 같은 요소에 널리 적용됩니다.

## Observable을 선택한 이유

NocoBase가 Redux, Recoil, Zustand, Jotai와 같은 다른 상태 관리 솔루션 대신 Observable을 선택한 주요 이유는 다음과 같습니다.

- **최고의 유연성**: Observable은 모든 객체, 배열, Map, Set 등을 반응형으로 만들 수 있습니다. 깊은 중첩과 동적 구조를 자연스럽게 지원하여 복잡한 비즈니스 모델에 매우 적합합니다.
- **비침투적**: action, reducer 또는 추가 store를 정의할 필요 없이 원본 객체를 직접 조작할 수 있어 개발 경험이 매우 뛰어납니다.
- **자동 종속성 추적**: `observer` 로 컴포넌트를 감싸기만 하면, 컴포넌트는 사용되는 Observable 속성을 자동으로 추적합니다. 데이터가 변경되면 UI가 자동으로 새로 고쳐지므로, 수동으로 종속성을 관리할 필요가 없습니다.
- **비 React 시나리오에도 적합**: Observable 반응형 메커니즘은 React뿐만 아니라 다른 프레임워크와도 결합하여 더 광범위한 반응형 데이터 요구 사항을 충족할 수 있습니다.

## observer를 사용해야 하는 이유

`observer`는 Observable 객체의 변화를 감지하고, 데이터가 변경될 때 React 컴포넌트의 업데이트를 자동으로 트리거합니다. 이를 통해 `setState`나 다른 업데이트 메서드를 수동으로 호출할 필요 없이 UI를 데이터와 동기화 상태로 유지할 수 있습니다.

## 기본 사용법

```tsx
import React from 'react';
import { Input } from 'antd';
import { observer, observable } from '@nocobase/flow-engine';

const obs = observable.deep({
  value: 'aa'
});

const MyComponent = observer(() => {
  return (
    <div>
      <Input
        defaultValue={obs.value}
        onChange={(e) => {
          obs.value = e.target.value;
        }}
      />
      <div>{obs.value}</div>
    </div>
  );
});

export default MyComponent;
```

반응형 사용법에 대해 더 자세히 알아보려면 [@formily/reactive](https://reactive.formilyjs.org/) 문서를 참조해 주세요.