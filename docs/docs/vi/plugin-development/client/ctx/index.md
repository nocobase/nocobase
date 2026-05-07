---
title: "Context - Ngữ cảnh"
description: "Cơ chế context phía client của NocoBase: this.context trong Plugin và useFlowContext() trong component là cùng một đối tượng, chỉ khác lối truy cập."
keywords: "Context,Ngữ cảnh,useFlowContext,this.context,FlowEngineContext,NocoBase"
---

# Context - Ngữ cảnh

Trong NocoBase, **Context (ngữ cảnh)** là cầu nối giữa code Plugin và các năng lực của NocoBase. Thông qua context, bạn có thể gửi request, làm i18n, ghi log, điều hướng trang, v.v.

Context có hai lối truy cập:

- **Trong Plugin**: `this.context`
- **Trong component React**: `useFlowContext()` (import từ `@nocobase/flow-engine`)

Cả hai đều trả về **cùng một đối tượng** (instance `FlowEngineContext`), chỉ khác ở tình huống sử dụng.

## Sử dụng trong Plugin

Trong các phương thức vòng đời như `load()` của Plugin, truy cập thông qua `this.context`:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Truy cập năng lực context thông qua this.context
    const { api, logger } = this.context;

    const response = await api.request({ url: 'app:getInfo' });
    logger.info('Thông tin ứng dụng', response.data);

    // I18n: this.t() sẽ tự động đưa tên gói plugin làm namespace
    console.log(this.t('Hello'));
  }
}
```

## Sử dụng trong component

Trong component React, lấy cùng một đối tượng context thông qua `useFlowContext()`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleClick = async () => {
    const response = await ctx.api.request({ url: 'users:list', method: 'get' });
    console.log(response.data);
  };

  return <button onClick={handleClick}>{ctx.t('Load data')}</button>;
}
```

## Thuộc tính tắt của Plugin so với thuộc tính ctx

Lớp Plugin cung cấp một số thuộc tính tắt để tiện sử dụng trong `load()`. Tuy nhiên cần lưu ý, **một số thuộc tính tắt của lớp Plugin và thuộc tính cùng tên trên ctx trỏ đến những thứ khác nhau**:

| Thuộc tính tắt của Plugin             | Trỏ đến                  | Mục đích                                 |
| --------------------------- | --------------------- | ------------------------------------ |
| `this.router`               | RouterManager         | Đăng ký route, dùng `.add()`                |
| `this.pluginSettingsManager` | PluginSettingsManager | Đăng ký trang cấu hình Plugin (`addMenuItem` + `addPageTabItem`) |
| `this.flowEngine`           | Instance FlowEngine       | Đăng ký FlowModel                       |
| `this.t()`                  | i18n.t() + tự động ns    | I18n, tự động đưa tên gói plugin             |
| `this.context`              | FlowEngineContext     | Đối tượng context, giống với useFlowContext() |

Trong đó dễ nhầm lẫn nhất là `this.router` và `ctx.router`:

- **`this.router`** (thuộc tính tắt của Plugin) → RouterManager, dùng để **đăng ký route** (`.add()`)
- **`ctx.router`** (thuộc tính của context) → instance React Router, dùng để **điều hướng trang** (`.navigate()`)

```ts
// Trong Plugin: đăng ký route
async load() {
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });
}
```

```tsx
// Trong component: điều hướng trang
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

## Các năng lực phổ biến mà context cung cấp

Dưới đây liệt kê các năng lực context phổ biến, tuy nhiên có một số chỉ dùng được trong Plugin, một số chỉ dùng được trong component, một số có cả hai bên nhưng cách viết khác nhau.

| Năng lực       | Plugin (`this.xxx`)          | Component (`ctx.xxx`)       | Mô tả                              |
| ---------- | ----------------------------- | ---------------------------- | --------------------------------- |
| Yêu cầu API   | `this.context.api`            | `ctx.api`                    | Cách dùng giống nhau                          |
| I18n     | `this.t()` / `this.context.t` | `ctx.t`                      | `this.t()` tự động đưa namespace của plugin |
| Log       | `this.context.logger`         | `ctx.logger`                 | Cách dùng giống nhau                          |
| Đăng ký route   | `this.router.add()`           | -                            | Chỉ Plugin                         |
| Điều hướng trang   | -                             | `ctx.router.navigate()`      | Chỉ component                            |
| Thông tin route   | `this.context.location`       | `ctx.route` / `ctx.location` | Khuyến nghị dùng trong component                  |
| Quản lý view   | `this.context.viewer`         | `ctx.viewer`                 | Mở dialog / drawer, v.v.                 |
| FlowEngine | `this.flowEngine`             | -                            | Chỉ Plugin                         |

Cách dùng chi tiết và ví dụ code của mỗi năng lực xem tại [Năng lực phổ biến](./common-capabilities).

## Liên kết liên quan

- [Năng lực phổ biến](./common-capabilities) — Cách dùng chi tiết của ctx.api, ctx.t, ctx.logger, v.v.
- [Plugin](../plugin) — Lối vào và thuộc tính tắt của Plugin
- [Phát triển Component](../component/index.md) — Cách dùng cơ bản của useFlowContext trong component
