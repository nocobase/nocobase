:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# createMockClient

Untuk contoh dan pengujian, umumnya disarankan untuk membangun aplikasi mock dengan cepat menggunakan `createMockClient`. Aplikasi mock adalah aplikasi kosong yang bersih tanpa plugin apa pun yang diaktifkan, dan hanya ditujukan untuk contoh serta pengujian.

Sebagai contoh:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Untuk skenario contoh dan pengujian
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` menyediakan `apiMock` untuk membangun data API mock.

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

// Untuk skenario contoh dan pengujian
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

Dengan `createMockClient`, kita dapat dengan cepat memperluas fungsionalitas melalui plugin. API umum untuk `Plugin` meliputi:

- plugin.router: Memperluas rute
- plugin.engine: Mesin frontend (NocoBase 2.0)
- plugin.context: Konteks (NocoBase 2.0)

Contoh 1: Menambahkan rute melalui router.

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

// Untuk skenario contoh dan pengujian
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Kami akan membahas lebih banyak konten di bab-bab selanjutnya.