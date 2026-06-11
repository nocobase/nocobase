---
title: "createMockClient Tools Test"
description: "createMockClient membuat Mock client untuk test FlowEngine, untuk unit test, Storybook, pengembangan contoh, mendukung apiMock untuk membangun Mock API."
keywords: "createMockClient,Mock client,unit test,Storybook,apiMock,test FlowEngine,NocoBase"
---

# createMockClient

Saat contoh dan testing, biasanya disarankan menggunakan createMockClient untuk dengan cepat membangun aplikasi Mock. Aplikasi Mock adalah aplikasi kosong yang bersih tanpa plugin yang diaktifkan, hanya untuk contoh dan test.

Misalnya contoh berikut:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Untuk skenario contoh dan test
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

createMockClient menyediakan apiMock untuk membangun data API Mock

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

// Untuk skenario contoh dan test
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

Berbasis createMockClient, kita dapat dengan cepat memperluas fungsi melalui plugin, API Plugin yang umum digunakan termasuk:

- plugin.router: Memperluas route
- plugin.engine: Engine front-end (NocoBase 2.0)
- plugin.context: Konteks (NocoBase 2.0)

Contoh 1: Menambahkan route melalui router.

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

// Untuk skenario contoh dan test
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Konten lebih lanjut akan kami perkenalkan di bab berikutnya.
