:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# FlowEngine과 플러그인의 관계

**FlowEngine**은 플러그인이 아닙니다. 대신, **코어 API**로서 플러그인에 제공되어 코어 기능과 비즈니스 확장을 연결하는 역할을 합니다.
NocoBase 2.0에서는 모든 API가 FlowEngine에 집중되어 있으며, 플러그인은 `this.engine`을 통해 FlowEngine에 접근할 수 있습니다.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: 중앙에서 관리되는 전역 기능

FlowEngine은 중앙 집중식 **Context**를 제공하여 다양한 시나리오에 필요한 API들을 한곳에 모아 관리합니다. 예를 들어:

```ts
class PluginHello extends Plugin {
  async load() {
    // 라우터 확장
    this.engine.context.router;

    // 요청 보내기
    this.engine.context.api.request();

    // 국제화 관련
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **참고**:
> Context는 NocoBase 2.0에서 1.x 버전의 다음 문제들을 해결했습니다.
>
> * 컨텍스트 분산 및 일관성 없는 호출
> * 서로 다른 React 렌더링 트리 간의 컨텍스트 손실
> * React 컴포넌트 내에서만 사용 가능
>
> 더 자세한 내용은 **FlowContext 챕터**를 참조하십시오.

---

## 플러그인의 단축 별칭

호출을 간소화하기 위해 FlowEngine은 플러그인 인스턴스에 일부 별칭을 제공합니다.

* `this.context` → `this.engine.context`와 동일합니다.
* `this.router` → `this.engine.context.router`와 동일합니다.

## 예시: 라우터 확장

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    this.router.add('root', {
      path: '/',
      element: <div>Hello</div>,
    });
  }
}

// 예시 및 테스트 시나리오용
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

이 예시에서:

* 플러그인은 `this.router.add` 메서드를 사용하여 `/` 경로의 라우터를 확장합니다.
* `createMockClient`는 예시 및 테스트에 편리한 깔끔한 Mock 애플리케이션을 제공합니다.
* `app.getRootComponent()`는 루트 컴포넌트를 반환하며, 이 컴포넌트는 페이지에 직접 마운트할 수 있습니다.