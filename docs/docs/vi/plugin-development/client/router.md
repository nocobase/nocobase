:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Bộ định tuyến

NocoBase client cung cấp một trình quản lý bộ định tuyến linh hoạt, cho phép bạn mở rộng các trang và trang cài đặt của plugin thông qua `router.add()` và `pluginSettingsRouter.add()`.

## Các tuyến đường trang mặc định đã đăng ký

| Tên            | Đường dẫn          | Thành phần          | Mô tả                 |
| -------------- | ----------------- | ------------------- | --------------------- |
| admin          | /admin/\*         | AdminLayout         | Các trang quản trị    |
| admin.page     | /admin/:name      | AdminDynamicPage    | Các trang được tạo động |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Các trang cài đặt plugin |

## Mở rộng trang thông thường

Thêm các tuyến đường trang thông thường thông qua `router.add()`.

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

Hỗ trợ tham số động

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Mở rộng trang cài đặt plugin

Thêm các trang cài đặt plugin thông qua `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Tiêu đề trang cài đặt
      icon: 'ApiOutlined', // Biểu tượng menu trang cài đặt
      Component: HelloSettingPage,
    });
  }
}
```

Ví dụ về định tuyến đa cấp

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Tuyến đường cấp cao nhất
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Các tuyến đường con
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