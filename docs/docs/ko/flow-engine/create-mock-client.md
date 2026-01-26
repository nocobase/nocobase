:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# createMockClient

예시 및 테스트 시, `createMockClient`를 사용하여 Mock 애플리케이션을 빠르게 구축하는 것이 일반적으로 권장됩니다. Mock 애플리케이션은 어떤 플러그인도 활성화되지 않은 깨끗한 빈 애플리케이션으로, 오직 예시 및 테스트 용도로만 사용됩니다.

예를 들어 다음 예시를 살펴보겠습니다.

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// 예시 및 테스트 시나리오용
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient`는 `apiMock`을 제공하여 Mock API 데이터를 구축할 수 있도록 합니다.

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    const { data } = await this.context.api.request({
      method: 'get',
      url: 'users',
    });
  }
}

// 예시 및 테스트 시나리오용
const app = createMockClient({
  plugins: [PluginHelloModel],
});

app.apiMock.onGet('users').reply(200, {
  data: {
    id: 1,
    name: 'John Doe',
  },
});

export default app.getRootComponent();
```

`createMockClient`를 기반으로, 플러그인을 통해 기능을 빠르게 확장할 수 있습니다. `Plugin`의 일반적인 API는 다음과 같습니다.

- `plugin.router`: 라우터 확장
- `plugin.engine`: 프런트엔드 엔진 (NocoBase 2.0)
- `plugin.context`: 컨텍스트 (NocoBase 2.0)

예시 1: 라우터를 통해 라우트를 추가합니다.

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

더 많은 내용은 다음 장에서 소개하겠습니다.