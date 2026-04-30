---
title: "Router - Định tuyến"
description: "Định tuyến phía client của NocoBase: đăng ký route trang qua this.router.add, đăng ký trang cài đặt plugin qua pluginSettingsManager (addMenuItem + addPageTabItem)."
keywords: "Router,Định tuyến,router.add,pluginSettingsManager,addMenuItem,addPageTabItem,componentLoader,Đăng ký trang,NocoBase"
---

# Router - Định tuyến

Trong NocoBase, Plugin đăng ký trang thông qua route. Hai cách phổ biến:

- `this.router.add()` — Đăng ký route trang thông thường
- `this.pluginSettingsManager.addMenuItem()` + `addPageTabItem()` — Đăng ký trang cài đặt plugin

Việc đăng ký route thường được thực hiện trong phương thức `load()` của Plugin, xem chi tiết tại [Plugin](./plugin).

:::warning Lưu ý

Plugin của NocoBase v2, route sau khi đăng ký sẽ tự động thêm tiền tố `/v2`, khi truy cập cần kèm theo tiền tố này.

:::

## Route mặc định

NocoBase đã đăng ký các route mặc định sau:

| Tên           | Đường dẫn                  | Component                | Mô tả           |
| -------------- | --------------------- | ------------------- | -------------- |
| admin          | /v2/admin/\*          | AdminLayout         | Trang quản trị   |
| admin.page     | /v2/admin/:name       | AdminDynamicPage    | Trang được tạo động |
| admin.settings | /v2/admin/settings/\* | AdminSettingsLayout | Trang cấu hình plugin   |

## Route trang

Đăng ký route trang thông qua `this.router.add()`. Component trang được khuyến nghị dùng `componentLoader` để tải theo nhu cầu, như vậy code trang sẽ chỉ được tải khi thực sự truy cập.

:::warning Lưu ý

Tệp trang phải dùng `export default` để export component.

:::

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Đăng ký trong `load()` của Plugin:

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('hello', {
      path: '/hello',
      // Tải theo nhu cầu, chỉ tải module này khi truy cập /v2/hello
      componentLoader: () => import('./pages/HelloPage'),
    });
  }
}
```

Tham số đầu tiên của `router.add()` là tên route, hỗ trợ dùng dấu chấm `.` để biểu diễn quan hệ cha-con. Ví dụ `root.home` biểu thị route con của `root`.

Trong component, có thể điều hướng đến route này thông qua `ctx.router.navigate('/hello')`.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { Button } from 'antd';

export default function SomeComponent() {
  const ctx = useFlowContext();
  return (
    <Button onClick={() => ctx.router.navigate('/hello')}>
      Go to Hello Page
    </Button>
  );
}
```

Chi tiết có thể tham khảo phần route trong [Phát triển Component](./component/index.md).

### Route lồng nhau

Lồng nhau thông qua đặt tên có dấu chấm, route cha dùng `<Outlet />` để render nội dung route con:

```tsx
import { Outlet } from 'react-router-dom';

class MyPlugin extends Plugin {
  async load() {
    // Route cha, dùng element để viết bố cục trực tiếp
    this.router.add('root', {
      element: (
        <div>
          <nav>Thanh điều hướng</nav>
          <Outlet />
        </div>
      ),
    });

    // Route con, dùng componentLoader để tải theo nhu cầu
    this.router.add('root.home', {
      path: '/', // -> /v2/
      componentLoader: () => import('./pages/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about', // -> /v2/about
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}
```

### Tham số động

Đường dẫn route hỗ trợ tham số động:

```tsx
this.router.add('root.user', {
  path: '/user/:id', // -> /v2/user/:id
  componentLoader: () => import('./pages/UserPage'),
});
```

Trong component, có thể lấy tham số động thông qua `ctx.route.params`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function UserPage() {
  const ctx = useFlowContext();
  const { id } = ctx.route.params; // Lấy tham số động id
  return <h1>User ID: {id}</h1>;
}
```

Chi tiết có thể tham khảo phần route trong [Phát triển Component](./component/index.md).

### componentLoader vs element

- **`componentLoader`** (khuyến nghị): Tải theo nhu cầu, phù hợp cho component trang, tệp trang cần `export default`
- **`element`**: Truyền JSX trực tiếp, phù hợp cho component bố cục hoặc trang inline rất nhẹ

Nếu trang có phụ thuộc nặng, khuyến nghị ưu tiên dùng `componentLoader`.

## Trang cài đặt plugin

Đăng ký trang cài đặt plugin thông qua `this.pluginSettingsManager`. Đăng ký chia làm hai bước — trước tiên dùng `addMenuItem()` để đăng ký mục menu, sau đó dùng `addPageTabItem()` để đăng ký trang thực tế. Trang cài đặt sẽ xuất hiện trong menu "Cấu hình plugin" của NocoBase.

![20260403155201](https://static-docs.nocobase.com/20260403155201.png)

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Đăng ký mục menu
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Cài đặt Hello'),
      icon: 'ApiOutlined', // Tên biểu tượng Ant Design, tham khảo https://5x.ant.design/components/icon
    });

    // Đăng ký trang (key là 'index' sẽ map đến đường dẫn gốc của menu)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Cài đặt Hello'),
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

Sau khi đăng ký, đường dẫn truy cập là `/admin/settings/hello`. Khi dưới menu chỉ có một trang, thanh tab phía trên sẽ tự động ẩn.

### Trang cài đặt nhiều Tab

Nếu trang cài đặt cần nhiều trang con, đăng ký nhiều `addPageTabItem` cho cùng một `menuKey` — phía trên sẽ tự động xuất hiện thanh tab:

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Đăng ký mục menu
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('HelloWorld'),
      icon: 'ApiOutlined',
    });

    // Tab 1: Cài đặt cơ bản (key là 'index', map đến /admin/settings/hello)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Cài đặt cơ bản'),
      componentLoader: () => import('./settings/GeneralPage'),
    });

    // Tab 2: Cài đặt nâng cao (map đến /admin/settings/hello/advanced)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'advanced',
      title: this.t('Cài đặt nâng cao'),
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```

### Tham số addMenuItem

| Trường       | Kiểu                  | Bắt buộc | Mô tả                                             |
| ---------- | --------------------- | ---- | ------------------------------------------------ |
| `key`      | `string`              | Có   | Định danh duy nhất của menu, không được chứa `.`                       |
| `title`    | `ReactNode`           | Không   | Tiêu đề menu                                         |
| `icon`     | `string \| ReactNode` | Không   | Biểu tượng menu, khi là chuỗi sẽ được render bằng `Icon` tích hợp             |
| `sort`     | `number`              | Không   | Giá trị sắp xếp, càng nhỏ càng ở trước, mặc định `0`                     |
| `showTabs` | `boolean`             | Không   | Có hiển thị thanh tab phía trên, mặc định tự động quyết định theo số trang      |
| `hidden`   | `boolean`             | Không   | Có ẩn mục điều hướng                                 |

### Tham số addPageTabItem

| Trường              | Kiểu        | Bắt buộc | Mô tả                                                        |
| ----------------- | ----------- | ---- | ----------------------------------------------------------- |
| `menuKey`         | `string`    | Có   | `key` của menu thuộc về, tương ứng với `key` của `addMenuItem`               |
| `key`             | `string`    | Có   | Định danh duy nhất của trang. `'index'` biểu thị trang mặc định, map đến đường dẫn gốc của menu      |
| `title`           | `ReactNode` | Không   | Tiêu đề trang (hiển thị trên tab)                                   |
| `componentLoader` | `Function`  | Không   | Component trang lazy load (khuyến nghị)                                      |
| `Component`       | `Component` | Không   | Truyền component trực tiếp (chọn một trong hai với `componentLoader`)                 |
| `sort`            | `number`    | Không   | Giá trị sắp xếp, càng nhỏ càng ở trước                                          |
| `hidden`          | `boolean`   | Không   | Có ẩn trong tab                                           |
| `link`            | `string`    | Không   | Liên kết ngoài, sau khi đặt thì click tab sẽ chuyển đến địa chỉ ngoài                   |

## Liên kết liên quan

- [Plugin](./plugin) — Route được đăng ký trong `load()`
- [Phát triển Component](./component/index.md) — Cách viết component trang được route mount
- [Ví dụ thực tế Plugin: Tạo trang cài đặt plugin](./examples/settings-page) — Ví dụ trang cài đặt đầy đủ
