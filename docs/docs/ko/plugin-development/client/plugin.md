:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 플러그인

NocoBase에서 **클라이언트 플러그인(Client Plugin)**은 프런트엔드 기능을 확장하고 사용자 정의하는 주요 방법입니다. `@nocobase/client`에서 제공하는 `Plugin` 기본 클래스를 상속받아, 개발자는 다양한 생명주기 단계에서 로직을 등록하고, 페이지 컴포넌트를 추가하며, 메뉴를 확장하거나 서드파티 기능을 통합할 수 있습니다.

## 플러그인 클래스 구조

가장 기본적인 클라이언트 플러그인 구조는 다음과 같습니다.

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // 플러그인이 추가된 후 실행됩니다.
    console.log('Plugin added');
  }

  async beforeLoad() {
    // 플러그인 로드 전에 실행됩니다.
    console.log('Before plugin load');
  }

  async load() {
    // 플러그인이 로드될 때 실행되며, 라우트, UI 컴포넌트 등을 등록합니다.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## 생명주기 설명

각 플러그인은 브라우저 새로고침 또는 애플리케이션 초기화 시 다음 생명주기를 순서대로 거칩니다.

| 생명주기 메서드 | 실행 시점 | 설명 |
|--------------|-----------|------|
| **afterAdd()** | 플러그인이 플러그인 관리자에 추가된 직후 실행됩니다. | 이때 플러그인 인스턴스는 생성되었지만, 모든 플러그인이 초기화를 완료한 것은 아닙니다. 설정 읽기 또는 기본 이벤트 바인딩과 같은 경량 초기화에 적합합니다. |
| **beforeLoad()** | 모든 플러그인의 `load()` 메서드 실행 전에 실행됩니다. | 모든 활성화된 플러그인 인스턴스(`this.app.pm.get()`)에 접근할 수 있습니다. 다른 플러그인에 의존하는 준비 로직을 실행하는 데 적합합니다. |
| **load()** | 플러그인이 로드될 때 실행됩니다. | 모든 플러그인의 `beforeLoad()` 메서드가 완료된 후 이 메서드가 실행됩니다. 프런트엔드 라우트, UI 컴포넌트 등 핵심 로직을 등록하는 데 적합합니다. |

## 실행 순서

브라우저를 새로고침할 때마다 `afterAdd()` → `beforeLoad()` → `load()` 순서로 실행됩니다.

## 플러그인 컨텍스트 및 FlowEngine

NocoBase 2.0부터 클라이언트 측 확장 API는 주로 **FlowEngine**에 집중되어 있습니다. 플러그인 클래스에서는 `this.engine`을 통해 엔진 인스턴스를 가져올 수 있습니다.

```ts
// load() 메서드에서 엔진 컨텍스트에 접근합니다.
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

더 자세한 내용은 다음을 참조하세요:
- [FlowEngine](/flow-engine)
- [컨텍스트](./context.md)