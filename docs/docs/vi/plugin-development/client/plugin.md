---
title: "Plugin - Plugin Client"
description: "Lối vào Plugin client của NocoBase: kế thừa lớp cơ sở Plugin, vòng đời afterAdd/beforeLoad/load, đăng ký route và FlowModel."
keywords: "Plugin,Plugin client,Vòng đời,afterAdd,beforeLoad,load,NocoBase"
---

# Plugin

Trong NocoBase, **Client Plugin (Plugin client)** là cách chính để mở rộng và tùy chỉnh chức năng frontend. Bạn có thể kế thừa lớp cơ sở `Plugin` được cung cấp bởi `@nocobase/client-v2` trong `src/client-v2/plugin.tsx` của thư mục Plugin, sau đó đăng ký route, model và các tài nguyên khác trong các vòng đời như `load()`.

Phần lớn thời gian bạn chỉ cần quan tâm đến `load()` — thông thường logic cốt lõi được đăng ký trong giai đoạn `load()`.

:::tip Điều kiện tiên quyết

Trước khi phát triển Plugin client, hãy đảm bảo bạn đã đọc chương [Viết Plugin đầu tiên](../write-your-first-plugin.md), đã sinh cấu trúc thư mục và tệp Plugin cơ bản.

:::

## Cấu trúc cơ bản

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Thực thi sau khi Plugin được thêm vào
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Thực thi trước load() của tất cả Plugin
    console.log('Before load');
  }

  async load() {
    // Thực thi khi Plugin được tải, đăng ký route, model, v.v.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Vòng đời

Mỗi khi trình duyệt làm mới hoặc ứng dụng khởi tạo, Plugin sẽ thực thi lần lượt `afterAdd()` → `beforeLoad()` → `load()`:

| Phương thức           | Thời điểm thực thi                       | Mô tả                                                                        |
| -------------- | ------------------------------ | --------------------------------------------------------------------------- |
| `afterAdd()`   | Sau khi instance Plugin được tạo                 | Lúc này không phải tất cả Plugin đã khởi tạo xong. Phù hợp để khởi tạo nhẹ, ví dụ đọc cấu hình.            |
| `beforeLoad()` | Trước `load()` của tất cả Plugin       | Có thể truy cập instance của các Plugin đã bật khác thông qua `this.app.pm.get()`. Phù hợp để xử lý phụ thuộc giữa các Plugin. |
| `load()`       | Sau khi tất cả `beforeLoad()` thực thi xong | **Vòng đời được dùng nhiều nhất.** Đăng ký route, FlowModel và các tài nguyên cốt lõi khác ở đây.               |

Thông thường, phát triển một Plugin client chỉ cần viết `load()` là đủ.

## Làm gì trong load()

`load()` là lối vào cốt lõi để đăng ký chức năng Plugin. Các thao tác phổ biến:

**Đăng ký route trang:**

```ts
async load() {
  // Đăng ký một trang độc lập
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // Đăng ký trang cài đặt plugin (menu + trang)
  this.pluginSettingsManager.addMenuItem({
    key: 'hello-settings',
    title: this.t('Cài đặt Hello'),
    icon: 'SettingOutlined',
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'hello-settings',
    key: 'index',
    title: this.t('Cài đặt Hello'),
    componentLoader: () => import('./pages/HelloSettingPage'),
  });
}
```

Cách dùng chi tiết xem tại [Router](./router).

**Đăng ký FlowModel:**

```ts
async load() {
  this.flowEngine.registerModelLoaders({
    HelloModel: {
      // Dynamic import, chỉ tải module tương ứng khi model này được dùng đến lần đầu
      loader: () => import('./HelloModel'),
    },
  });
}
```

`registerModelLoaders` dùng tải theo nhu cầu (dynamic import), chỉ tải module tương ứng khi model được dùng lần đầu, là cách đăng ký được khuyến nghị. Cách dùng chi tiết xem tại [FlowEngine](./flow-engine/index.md).

## Thuộc tính phổ biến của Plugin

Trong lớp Plugin, các thuộc tính sau có thể truy cập trực tiếp qua `this`:

| Thuộc tính                        | Mô tả                                                     |
| --------------------------- | -------------------------------------------------------- |
| `this.router`               | Trình quản lý route, dùng để đăng ký route trang                             |
| `this.pluginSettingsManager` | Trình quản lý trang cài đặt plugin (`addMenuItem` + `addPageTabItem`)      |
| `this.flowEngine`           | Instance FlowEngine, dùng để đăng ký FlowModel                      |
| `this.engine`               | Bí danh của `this.flowEngine`                                 |
| `this.context`              | Đối tượng context, trả về cùng đối tượng với `useFlowContext()` trong component  |
| `this.app`                  | Instance Application                                         |
| `this.app.eventBus`         | Bus sự kiện cấp ứng dụng (`EventTarget`), dùng để lắng nghe sự kiện vòng đời     |

Nếu cần truy cập nhiều năng lực NocoBase hơn (ví dụ `api`, `t`(i18n), `logger`), có thể lấy thông qua `this.context`:

```ts
async load() {
  const { api, t, logger } = this.context;
}
```

Xem thêm năng lực context tại [Context](./ctx/index.md).

## Liên kết liên quan

- [Router](./router) — Đăng ký route trang và trang cài đặt plugin
- [Phát triển Component](./component/index.md) — Cách viết component React được route mount
- [Context](./ctx/index.md) — Sử dụng các năng lực tích hợp của NocoBase thông qua context
- [FlowEngine](./flow-engine/index.md) — Đăng ký các component cấu hình trực quan như Block, Field, Action
- [Viết Plugin đầu tiên](../write-your-first-plugin.md) — Tạo Plugin từ đầu
