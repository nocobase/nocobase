:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# createMockClient

สำหรับการสร้างตัวอย่างและการทดสอบ เรามักจะแนะนำให้ใช้ `createMockClient` เพื่อสร้าง Mock แอปพลิเคชันได้อย่างรวดเร็วครับ Mock แอปพลิเคชันนี้จะเป็นแอปพลิเคชันที่ว่างเปล่า สะอาด และไม่มีปลั๊กอินใด ๆ ทำงานอยู่ โดยมีวัตถุประสงค์เพื่อใช้ในการสร้างตัวอย่างและการทดสอบเท่านั้นครับ

ตัวอย่างเช่น:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// สำหรับสถานการณ์ตัวอย่างและการทดสอบ
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` มี `apiMock` ให้ใช้สำหรับสร้างข้อมูล Mock API ครับ

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

// สำหรับสถานการณ์ตัวอย่างและการทดสอบ
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

เมื่อใช้ `createMockClient` เราสามารถขยายฟังก์ชันการทำงานผ่านปลั๊กอินได้อย่างรวดเร็วครับ โดย API ที่ใช้บ่อยสำหรับ `Plugin` ได้แก่:

- `plugin.router`: สำหรับขยายเราต์ (routes)
- `plugin.engine`: เอนจินส่วนหน้า (Frontend engine) (NocoBase 2.0)
- `plugin.context`: คอนเท็กซ์ (Context) (NocoBase 2.0)

ตัวอย่างที่ 1: การเพิ่มเราต์ (route) ผ่าน `router` ครับ

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

// สำหรับสถานการณ์ตัวอย่างและการทดสอบ
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

เราจะแนะนำเนื้อหาเพิ่มเติมในบทถัดไปครับ