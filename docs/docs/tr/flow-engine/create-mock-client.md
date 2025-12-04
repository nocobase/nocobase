:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# createMockClient

Örnekler ve testler için genellikle `createMockClient` kullanarak hızlıca bir Mock uygulama oluşturmanız önerilir. Mock uygulama, hiçbir eklentinin etkinleştirilmediği, yalnızca örnekler ve testler için tasarlanmış temiz, boş bir uygulamadır.

Örneğin:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Örnek ve test senaryoları için
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient`, mock API verileri oluşturmak için `apiMock` sağlar.

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

// Örnek ve test senaryoları için
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

`createMockClient` temelinde, eklentiler aracılığıyla işlevselliği hızla genişletebiliriz. `Plugin` için yaygın API'lar şunları içerir:

- `plugin.router`: Rotaları genişletme
- `plugin.engine`: Ön uç motoru (NocoBase 2.0)
- `plugin.context`: Bağlam (NocoBase 2.0)

Örnek 1: Router aracılığıyla bir rota ekleme.

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

// Örnek ve test senaryoları için
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Daha fazla içeriği sonraki bölümlerde tanıtacağız.