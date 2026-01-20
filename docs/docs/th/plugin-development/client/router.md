:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# Router (เราเตอร์)

NocoBase client มีตัวจัดการเราเตอร์ที่ยืดหยุ่น ซึ่งรองรับการขยายหน้าเพจและหน้าตั้งค่าปลั๊กอินต่างๆ ผ่านเมธอด `router.add()` และ `pluginSettingsRouter.add()` ครับ/ค่ะ

## เราเตอร์เริ่มต้นสำหรับหน้าเพจที่ลงทะเบียนไว้

| ชื่อ           | เส้นทาง            | คอมโพเนนต์          | คำอธิบาย              |
| -------------- | ------------------ | ------------------- |-----------------------|
| admin          | /admin/\*          | AdminLayout         | หน้าจัดการระบบหลังบ้าน |
| admin.page     | /admin/:name       | AdminDynamicPage    | หน้าเพจที่สร้างขึ้นแบบไดนามิก |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | หน้าตั้งค่าปลั๊กอิน    |

## การขยายหน้าเพจทั่วไป

คุณสามารถเพิ่มเส้นทางเราเตอร์สำหรับหน้าเพจทั่วไปได้โดยใช้เมธอด `router.add()` ครับ/ค่ะ

```tsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

const Layout = () => (
  <div>
    <div>
      <Link to="/">Home</Link> | <Link to="/about">About</Link>
    </div>
    <Outlet />
  </div>
);

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', { element: <Layout /> });

    this.router.add('root.home', { path: '/', element: <Home /> });
    this.router.add('root.about', { path: '/about', element: <About /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin]
});

export default app.getRootComponent();
```

รองรับพารามิเตอร์แบบไดนามิก

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## การขยายหน้าตั้งค่าปลั๊กอิน

คุณสามารถเพิ่มหน้าตั้งค่าปลั๊กอินได้โดยใช้เมธอด `pluginSettingsRouter.add()` ครับ/ค่ะ

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // กำหนดชื่อเรื่องของหน้าตั้งค่า
      icon: 'ApiOutlined', // กำหนดไอคอนเมนูของหน้าตั้งค่า
      Component: HelloSettingPage,
    });
  }
}
```

ตัวอย่างการกำหนดเส้นทางแบบหลายระดับ

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // เส้นทางระดับบนสุด
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // เส้นทางย่อย
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      Component: () => <div>Demo1 Page Content</div>,
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      Component: () => <div>Demo2 Page Content</div>,
    });
  }
}
```