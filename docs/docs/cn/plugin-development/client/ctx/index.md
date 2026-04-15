---
title: "Context 上下文"
description: "NocoBase 客户端上下文机制：Plugin 里的 this.context 和组件里的 useFlowContext() 是同一个对象，访问入口不同。"
keywords: "Context,上下文,useFlowContext,this.context,FlowEngineContext,NocoBase"
---

# Context 上下文

在 NocoBase 中，**上下文（Context）** 是连接插件代码和 NocoBase 能力的桥梁。通过上下文你可以发请求、做国际化、写日志、导航页面等。

上下文有两个访问入口：

- **Plugin 里**：`this.context`
- **React 组件里**：`useFlowContext()`（从 `@nocobase/flow-engine` 导入）

这两者返回的是**同一个对象**（`FlowEngineContext` 实例），只是使用场景不同。

## 在 Plugin 里使用

在插件的 `load()` 等生命周期方法中，通过 `this.context` 访问：

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 通过 this.context 访问上下文能力
    const { api, logger } = this.context;

    const response = await api.request({ url: 'app:getInfo' });
    logger.info('应用信息', response.data);

    // 国际化：this.t() 会自动注入插件包名作为 namespace
    console.log(this.t('Hello'));
  }
}
```

## 在组件里使用

在 React 组件中，通过 `useFlowContext()` 获取同一个上下文对象：

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

## Plugin 快捷属性 vs ctx 属性

Plugin 类提供了一些快捷属性，方便在 `load()` 里使用。不过要注意，**有些 Plugin 类的快捷属性和 ctx 上的同名属性指向不同的东西**：

| Plugin 快捷属性             | 指向                  | 用途                                 |
| --------------------------- | --------------------- | ------------------------------------ |
| `this.router`               | RouterManager         | 注册路由，用 `.add()`                |
| `this.pluginSettingsManager` | PluginSettingsManager | 注册插件配置页（`addMenuItem` + `addPageTabItem`） |
| `this.flowEngine`           | FlowEngine 实例       | 注册 FlowModel                       |
| `this.t()`                  | i18n.t() + 自动 ns    | 国际化，自动注入插件包名             |
| `this.context`              | FlowEngineContext     | 上下文对象，和 useFlowContext() 一致 |

其中最容易混淆的是 `this.router` 和 `ctx.router`：

- **`this.router`**（Plugin 快捷属性）→ RouterManager，用来**注册路由**（`.add()`）
- **`ctx.router`**（上下文属性）→ React Router 实例，用来**页面导航**（`.navigate()`）

```ts
// Plugin 里：注册路由
async load() {
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });
}
```

```tsx
// 组件里：页面导航
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

## 上下文提供的常用能力

这里列出常用的上下文能力，不过有些能力只在 Plugin 里可用，有些只在组件里可用，有些两边都有但写法不同。

| 能力       | Plugin（`this.xxx`）          | Component（`ctx.xxx`）       | 说明                              |
| ---------- | ----------------------------- | ---------------------------- | --------------------------------- |
| API 请求   | `this.context.api`            | `ctx.api`                    | 用法一致                          |
| 国际化     | `this.t()` / `this.context.t` | `ctx.t`                      | `this.t()` 自动注入插件 namespace |
| 日志       | `this.context.logger`         | `ctx.logger`                 | 用法一致                          |
| 路由注册   | `this.router.add()`           | -                            | 仅 Plugin                         |
| 页面导航   | -                             | `ctx.router.navigate()`      | 仅组件                            |
| 路由信息   | `this.context.location`       | `ctx.route` / `ctx.location` | 建议在组件中使用                  |
| 视图管理   | `this.context.viewer`         | `ctx.viewer`                 | 打开弹窗 / 抽屉等                 |
| FlowEngine | `this.flowEngine`             | -                            | 仅 Plugin                         |

每项能力的详细用法和代码示例见 [常用能力](./common-capabilities)。

## 相关链接

- [常用能力](./common-capabilities) — ctx.api、ctx.t、ctx.logger 等详细用法
- [Plugin 插件](../plugin) — 插件入口和快捷属性
- [Component 组件开发](../component/index.md) — useFlowContext 在组件中的基本用法
