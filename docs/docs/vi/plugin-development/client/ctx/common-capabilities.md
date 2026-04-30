---
title: "Khả năng thường dùng"
description: "Các khả năng thường dùng của context phía client NocoBase: ctx.api request, ctx.t i18n, ctx.logger logging, ctx.router routing, ctx.viewer quản lý view, ctx.acl điều khiển quyền."
keywords: "ctx.api,ctx.t,ctx.i18n,ctx.logger,ctx.router,ctx.route,ctx.viewer,ctx.acl,NocoBase"
---

# Khả năng thường dùng

Đối tượng context cung cấp các khả năng tích hợp sẵn của NocoBase. Tuy nhiên có những khả năng chỉ dùng được trong Plugin, có những khả năng chỉ dùng được trong component, và có những khả năng có ở cả hai phía nhưng cách viết khác nhau. Trước tiên hãy xem tổng quan:

| Khả năng | Plugin (`this.xxx`) | Component (`ctx.xxx`) | Mô tả |
| -------- | ------------------- | --------------------- | ----- |
| API request | `this.context.api` | `ctx.api` | Cách dùng giống nhau |
| i18n | `this.t()` / `this.context.t` | `ctx.t` | `this.t()` tự động inject namespace của plugin |
| Logging | `this.context.logger` | `ctx.logger` | Cách dùng giống nhau |
| Đăng ký route | `this.router.add()` | - | Chỉ Plugin |
| Điều hướng trang | - | `ctx.router.navigate()` | Chỉ component |
| Thông tin route | `this.context.location` | `ctx.route` / `ctx.location` | Khuyến nghị dùng trong component |
| Quản lý view | `this.context.viewer` | `ctx.viewer` | Mở dialog / drawer, v.v. |
| FlowEngine | `this.flowEngine` | - | Chỉ Plugin |

Sau đây sẽ giới thiệu lần lượt theo từng namespace.

## API request (ctx.api)

Gọi API backend qua `ctx.api.request()`, cách dùng giống [Axios](https://axios-http.com/).

### Sử dụng trong Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Gửi request trực tiếp trong load()
    const response = await this.context.api.request({
      url: 'app:getInfo',
      method: 'get',
    });
    console.log('Thông tin ứng dụng', response.data);
  }
}
```

### Sử dụng trong Component

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    // GET request
    const response = await ctx.api.request({
      url: 'users:list',
      method: 'get',
    });
    console.log(response.data);

    // POST request
    await ctx.api.request({
      url: 'users:create',
      method: 'post',
      data: { name: 'Tao Tao' },
    });
  };

  return <button onClick={handleLoad}>Tải dữ liệu</button>;
}
```

### Kết hợp với ahooks useRequest

Trong component, bạn có thể dùng `useRequest` của [ahooks](https://ahooks.js.org/hooks/use-request/index) để đơn giản hóa việc quản lý trạng thái request:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';

export default function PostList() {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Request lỗi: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
}
```

### Request interceptor

Qua `ctx.api.axios` bạn có thể thêm request/response interceptor, thường được set trong `load()` của Plugin:

```ts
async load() {
  // Request interceptor: thêm custom header
  this.context.api.axios.interceptors.request.use((config) => {
    config.headers['X-Custom-Header'] = 'my-value';
    return config;
  });

  // Response interceptor: xử lý lỗi thống nhất
  this.context.api.axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Request lỗi', error);
      return Promise.reject(error);
    },
  );
}
```

### Custom header của NocoBase

NocoBase Server hỗ trợ các custom header sau, thường được interceptor tự động inject, không cần set thủ công:

| Header | Mô tả |
| ------ | ----- |
| `X-App` | Chỉ định ứng dụng đang truy cập trong kịch bản multi-app |
| `X-Locale` | Ngôn ngữ hiện tại (ví dụ `zh-CN`, `en-US`) |
| `X-Hostname` | Hostname của client |
| `X-Timezone` | Timezone của client (ví dụ `+08:00`) |
| `X-Role` | Role hiện tại |
| `X-Authenticator` | Phương thức xác thực hiện tại của user |

## i18n (ctx.t / ctx.i18n)

Plugin NocoBase quản lý các file đa ngôn ngữ qua thư mục `src/locale/`, dùng `ctx.t()` để sử dụng bản dịch trong code.

### File đa ngôn ngữ

Trong `src/locale/` của plugin, tạo các file JSON theo từng ngôn ngữ:

```bash
plugin-hello/
└── src/
    └── locale/
        ├── zh-CN.json
        └── en-US.json
```

```json
// zh-CN.json
{
  "Hello": "你好",
  "Your name is {{name}}": "你的名字是 {{name}}"
}
```

```json
// en-US.json
{
  "Hello": "Hello",
  "Your name is {{name}}": "Your name is {{name}}"
}
```

:::warning Lưu ý

Khi thêm file ngôn ngữ lần đầu, bạn cần khởi động lại ứng dụng để có hiệu lực.

:::

### ctx.t()

Trong component, lấy văn bản đã dịch qua `ctx.t()`:

```tsx
const ctx = useFlowContext();

// Cách dùng cơ bản
ctx.t('Hello');

// Có biến
ctx.t('Your name is {{name}}', { name: 'NocoBase' });

// Chỉ định namespace (namespace mặc định là tên package của plugin)
ctx.t('Hello', { ns: '@my-project/plugin-hello' });
```

### this.t()

Trong Plugin dùng `this.t()` tiện hơn — nó **tự động inject tên package của plugin làm namespace**, không cần truyền `ns` thủ công:

```ts
class MyPlugin extends Plugin {
  async load() {
    // Tự động dùng tên package của plugin hiện tại làm ns
    console.log(this.t('Hello'));

    // Tương đương với
    console.log(this.context.t('Hello', { ns: '@my-project/plugin-hello' }));
  }
}
```

### ctx.i18n

`ctx.i18n` là instance [i18next](https://www.i18next.com/) ở tầng dưới, thường thì dùng `ctx.t()` là đủ. Tuy nhiên nếu bạn cần chuyển ngôn ngữ động, lắng nghe thay đổi ngôn ngữ, v.v., bạn có thể dùng `ctx.i18n`:

```ts
// Lấy ngôn ngữ hiện tại
const currentLang = ctx.i18n.language; // 'zh-CN'

// Lắng nghe thay đổi ngôn ngữ
ctx.i18n.on('languageChanged', (lng) => {
  console.log('Đã chuyển ngôn ngữ sang', lng);
});
```

### tExpr()

`tExpr()` được dùng để sinh chuỗi biểu thức dịch trễ, thường dùng trong `FlowModel.define()` — vì define được thực thi khi module được load, lúc đó chưa có instance i18n:

```ts
import { tExpr } from '@nocobase/flow-engine';

HelloBlockModel.define({
  label: tExpr('Hello block'), // Sinh ra '{{t("Hello block")}}', dịch khi runtime
});
```

Cách dùng i18n đầy đủ hơn (cách viết file dịch, hook useT, tExpr, v.v.) xem tại [i18n](../component/i18n). Danh sách đầy đủ mã ngôn ngữ NocoBase hỗ trợ xem tại [Danh sách ngôn ngữ](../../languages).

## Logging (ctx.logger)

Output structured log qua `ctx.logger`, dựa trên [pino](https://github.com/pinojs/pino).

### Sử dụng trong Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.context.logger.info('Plugin load xong', { plugin: 'my-plugin' });
    this.context.logger.error('Khởi tạo thất bại', { error });
  }
}
```

### Sử dụng trong Component

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    ctx.logger.info('Trang load xong', { page: 'UserList' });
    ctx.logger.debug('Trạng thái user hiện tại', { user });
  };

  // ...
}
```

Mức độ log từ cao đến thấp: `fatal` > `error` > `warn` > `info` > `debug` > `trace`. Chỉ log có mức lớn hơn hoặc bằng mức cấu hình hiện tại mới được output.

## Routing (ctx.router / ctx.route / ctx.location)

Các khả năng liên quan đến routing chia làm ba phần: đăng ký (chỉ Plugin), điều hướng và lấy thông tin (chỉ component).

### Đăng ký route (this.router / this.pluginSettingsManager)

Trong `load()` của Plugin, đăng ký route trang qua `this.router.add()`, đăng ký trang cài đặt plugin qua `this.pluginSettingsManager`:

```ts
async load() {
  // Đăng ký route trang thông thường
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // Đăng ký trang cài đặt plugin (sẽ xuất hiện trong menu "Cấu hình Plugin")
  this.pluginSettingsManager.addMenuItem({
    key: 'my-settings',
    title: this.t('My Settings'),
    icon: 'SettingOutlined', // Icon Ant Design, tham khảo https://5x.ant.design/components/icon
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'my-settings',
    key: 'index',
    title: this.t('My Settings'),
    componentLoader: () => import('./pages/MySettingsPage'),
  });
}
```

Cách dùng chi tiết xem tại [Router](../router). Ví dụ trang cài đặt đầy đủ xem tại [Tạo một trang cài đặt Plugin](../examples/settings-page).

:::warning Lưu ý

`this.router` là RouterManager, dùng để **đăng ký route**. `this.pluginSettingsManager` là PluginSettingsManager, dùng để **đăng ký trang cài đặt**. Cả hai khác với `ctx.router` trong component (React Router, dùng để **điều hướng trang**).

:::

### Điều hướng trang (ctx.router)

Trong component, điều hướng trang qua `ctx.router.navigate()`:

```tsx
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

### Thông tin route (ctx.route)

Trong component, lấy thông tin route hiện tại qua `ctx.route`:

```tsx
const ctx = useFlowContext();

// Lấy tham số động (ví dụ route được định nghĩa là /users/:id)
const { id } = ctx.route.params;

// Lấy tên route
const { name } = ctx.route;
```

Type đầy đủ của `ctx.route`:

```ts
interface RouteOptions {
  name?: string;         // Định danh duy nhất của route
  path?: string;         // Template của route
  pathname?: string;     // Đường dẫn đầy đủ của route
  params?: Record<string, any>; // Tham số route
}
```

### URL hiện tại (ctx.location)

`ctx.location` cung cấp thông tin chi tiết của URL hiện tại, tương tự `window.location` của trình duyệt:

```tsx
const ctx = useFlowContext();

console.log(ctx.location.pathname); // '/v2/hello'
console.log(ctx.location.search);   // '?page=1'
console.log(ctx.location.hash);     // '#section'
```

`ctx.route` và `ctx.location` tuy cũng truy cập được qua `this.context` trong Plugin, nhưng URL khi plugin load là không xác định, giá trị lấy được không có ý nghĩa. Khuyến nghị dùng trong component.

## Quản lý View (ctx.viewer / ctx.view)

`ctx.viewer` cung cấp khả năng mở dialog, drawer, v.v. theo kiểu imperative. Dùng được cả trong Plugin và component.

### Sử dụng trong Plugin

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Ví dụ mở dialog trong logic khởi tạo
    this.context.viewer.dialog({
      title: 'Chào mừng',
      content: () => <div>Plugin đã khởi tạo xong</div>,
    });
  }
}
```

### Sử dụng trong Component

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const openDetail = () => {
    // Mở dialog
    ctx.viewer.dialog({
      title: 'Chỉnh sửa user',
      content: () => <UserEditForm />,
    });
  };

  const openDrawer = () => {
    // Mở drawer
    ctx.viewer.drawer({
      title: 'Chi tiết',
      content: () => <UserDetail />,
    });
  };

  return (
    <div>
      <Button onClick={openDetail}>Chỉnh sửa</Button>
      <Button onClick={openDrawer}>Xem chi tiết</Button>
    </div>
  );
}
```

### Method chung

```tsx
// Chỉ định loại view qua type
ctx.viewer.open({
  type: 'dialog',  // 'dialog' | 'drawer' | 'popover' | 'embed'
  title: 'Tiêu đề',
  content: () => <SomeComponent />,
});
```

### Thao tác bên trong view (ctx.view)

Trong component bên trong dialog/drawer, bạn có thể thao tác với view hiện tại qua `ctx.view` (ví dụ đóng):

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

function DialogContent() {
  const ctx = useFlowContext();
  return (
    <div>
      <p>Nội dung dialog</p>
      <Button onClick={() => ctx.view.close()}>Đóng</Button>
    </div>
  );
}
```

## FlowEngine (this.flowEngine)

`this.flowEngine` là instance FlowEngine, chỉ dùng được trong Plugin. Thường dùng để đăng ký FlowModel:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Đăng ký FlowModel (khuyến nghị cách load theo nhu cầu)
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

FlowModel là phần lõi của hệ thống cấu hình trực quan của NocoBase — nếu component của bạn cần xuất hiện trong menu "Thêm Block / Field / Action", bạn cần wrap qua FlowModel. Cách dùng chi tiết xem tại [FlowEngine](../flow-engine/index.md).

## Các khả năng khác

Các khả năng dưới đây có thể dùng đến trong các kịch bản nâng cao hơn, liệt kê tóm tắt ở đây:

| Thuộc tính | Mô tả |
| ---------- | ----- |
| `ctx.model` | Instance FlowModel hiện tại (dùng được trong context thực thi Flow) |
| `ctx.ref` | Reference của component, dùng kèm `ctx.onRefReady` |
| `ctx.exit()` | Thoát khỏi việc thực thi Flow hiện tại |
| `ctx.defineProperty()` | Thêm thuộc tính tùy chỉnh động vào context |
| `ctx.defineMethod()` | Thêm method tùy chỉnh động vào context |
| `ctx.useResource()` | Lấy interface thao tác resource dữ liệu |
| `ctx.dataSourceManager` | Quản lý data source |

Cách dùng chi tiết của các khả năng này có thể tham khảo tại [Tài liệu đầy đủ FlowEngine](../../../flow-engine/index.md).

## Liên kết liên quan

- [Tổng quan Context](../ctx/index.md) — Sự khác biệt giữa hai cách vào context
- [Plugin](../plugin) — Các thuộc tính tắt của Plugin
- [Phát triển Component](../component/index.md) — Cách dùng useFlowContext trong component
- [Router](../router) — Đăng ký route và điều hướng
- [Tài liệu đầy đủ FlowEngine](../../../flow-engine/index.md) — Tham chiếu đầy đủ về FlowEngine
- [i18n](../component/i18n) — Cách viết file dịch, tExpr, useT
- [Danh sách ngôn ngữ](../../languages) — Mã ngôn ngữ NocoBase hỗ trợ
- [Tạo một trang cài đặt Plugin](../examples/settings-page) — Ví dụ đầy đủ về cách dùng ctx.api
- [Tổng quan FlowEngine](../flow-engine/index.md) — Cách dùng cơ bản của FlowModel
