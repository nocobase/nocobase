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

Thêm các route trang thông thường bằng `router.add()`. Đối với component trang, hãy dùng `componentLoader` để đăng ký theo nhu cầu, để mô-đun trang chỉ được tải khi route đó thực sự được truy cập.

Các tệp trang phải dùng `export default`:

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
      // Import động: mô-đun trang chỉ được tải khi thực sự đi vào route này
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

Hỗ trợ tham số động

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Nếu trang nặng hoặc không cần ở lần render đầu tiên, hãy ưu tiên `componentLoader`; `element` vẫn phù hợp cho route bố cục hoặc các trang inline rất nhẹ.

## Mở rộng trang cài đặt plugin

Thêm trang cài đặt plugin bằng `pluginSettingsRouter.add()`. Tương tự các route trang thông thường, trang cài đặt cũng nên dùng `componentLoader`.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Tiêu đề trang cài đặt
      icon: 'ApiOutlined', // Biểu tượng menu trang cài đặt
      // Import động: mô-đun trang chỉ được tải khi thực sự đi vào trang cài đặt này
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // Các tuyến đường con
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Import động: mô-đun trang chỉ được tải khi thực sự đi vào trang cài đặt này
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```