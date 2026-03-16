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

เพิ่มเส้นทางหน้าทั่วไปด้วย `router.add()` สำหรับคอมโพเนนต์ของหน้า ควรใช้ `componentLoader` เพื่อให้โหลดโมดูลของหน้าเมื่อมีการเข้าเส้นทางนั้นจริง ๆ เท่านั้น

ไฟล์หน้าต้องใช้ `export default`:

```tsx
// routes/HomePage.tsx
export default function HomePage() {
  return <h1>Home</h1>;
}
```

```tsx
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

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

    this.router.add('root.home', {
      path: '/',
      // การนำเข้าแบบไดนามิก: โมดูลของหน้าจะถูกโหลดเมื่อเข้าสู่เส้นทางนี้จริง ๆ เท่านั้น
      componentLoader: () => import('./routes/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about',
      componentLoader: () => import('./routes/AboutPage'),
    });
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

หากหน้ามีน้ำหนักมากหรือไม่จำเป็นในช่วงเรนเดอร์ครั้งแรก ควรเลือกใช้ `componentLoader`; ส่วน `element` ยังคงเหมาะกับเส้นทางเลย์เอาต์หรือหน้า inline ที่เบามาก

## การขยายหน้าตั้งค่าปลั๊กอิน

เพิ่มหน้าการตั้งค่าปลั๊กอินด้วย `pluginSettingsRouter.add()` เช่นเดียวกับเส้นทางหน้าทั่วไป หน้าการตั้งค่าก็ควรใช้ `componentLoader` เช่นกัน

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // กำหนดชื่อเรื่องของหน้าตั้งค่า
      icon: 'ApiOutlined', // กำหนดไอคอนเมนูของหน้าตั้งค่า
      // การนำเข้าแบบไดนามิก: โมดูลของหน้าจะถูกโหลดเมื่อเข้าสู่หน้าการตั้งค่านี้จริง ๆ เท่านั้น
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // เส้นทางย่อย
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // การนำเข้าแบบไดนามิก: โมดูลของหน้าจะถูกโหลดเมื่อเข้าสู่หน้าการตั้งค่านี้จริง ๆ เท่านั้น
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```