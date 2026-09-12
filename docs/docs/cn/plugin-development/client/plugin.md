---
title: "Plugin 客户端插件"
description: "NocoBase 客户端插件入口：继承 Plugin 基类、afterAdd/beforeLoad/load 生命周期、注册路由和 FlowModel。"
keywords: "Plugin,客户端插件,生命周期,afterAdd,beforeLoad,load,NocoBase"
---

# Plugin 插件

在 NocoBase 中，**客户端插件（Client Plugin）** 是扩展和定制前端功能的主要方式。你可以在插件目录的 `src/client-v2/plugin.tsx` 里继承 `@nocobase/client-v2` 提供的 `Plugin` 基类，然后在 `load()` 等生命周期里注册路由、模型和其他资源。

大部分时候你只需要关心 `load()`——通常来说核心逻辑是注册在 `load()` 阶段。

:::tip 前置条件

开发客户端插件之前，请确保你已经阅读了 [编写第一个插件](../write-your-first-plugin.md) 章节，生成了基本的插件目录结构和文件。

:::

## 基本结构

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // 插件被添加后执行
    console.log('Plugin added');
  }

  async beforeLoad() {
    // 在所有插件的 load() 之前执行
    console.log('Before load');
  }

  async load() {
    // 插件加载时执行，注册路由、模型等
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## 生命周期

每次浏览器刷新或应用初始化时，插件会依次执行 `afterAdd()` → `beforeLoad()` → `load()`：

| 方法           | 执行时机                       | 说明                                                                        |
| -------------- | ------------------------------ | --------------------------------------------------------------------------- |
| `afterAdd()`   | 插件实例创建后                 | 此时并非所有插件都已初始化完成。适合做轻量初始化，比如读取配置。            |
| `beforeLoad()` | 所有插件的 `load()` 之前       | 可以通过 `this.app.pm.get()` 访问其他已启用的插件实例。适合处理插件间依赖。 |
| `load()`       | 所有 `beforeLoad()` 执行完毕后 | **最常用的生命周期。** 在这里注册路由、FlowModel 等核心资源。               |

通常来说，开发一个客户端插件只需要写 `load()` 就够了。

## 在 load() 里做什么

`load()` 是注册插件功能的核心入口。常见操作：

**注册页面路由：**

```ts
async load() {
  // 注册一个独立页面
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // 注册插件设置页（菜单 + 页面）
  this.pluginSettingsManager.addMenuItem({
    key: 'hello-settings',
    title: this.t('Hello 设置'),
    icon: 'SettingOutlined',
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'hello-settings',
    key: 'index',
    title: this.t('Hello 设置'),
    componentLoader: () => import('./pages/HelloSettingPage'),
  });
}
```

详细用法见 [Router 路由](./router)。

**注册 FlowModel：**

```ts
async load() {
  this.flowEngine.registerModelLoaders({
    HelloModel: {
      // 动态导入，首次真正用到这个 model 时才会加载对应模块
      loader: () => import('./HelloModel'),
    },
  });
}
```

`registerModelLoaders` 使用按需加载（动态导入），只有在模型首次被使用时才会加载对应模块，是推荐的注册方式。详细用法见 [FlowEngine](./flow-engine/index.md)。

## 插件常用属性

在插件类中，以下属性可以直接通过 `this` 访问：

| 属性                        | 说明                                                     |
| --------------------------- | -------------------------------------------------------- |
| `this.router`               | 路由管理器，用于注册页面路由                             |
| `this.pluginSettingsManager` | 插件设置页管理器（`addMenuItem` + `addPageTabItem`）      |
| `this.flowEngine`           | FlowEngine 实例，用于注册 FlowModel                      |
| `this.engine`               | `this.flowEngine` 的别名                                 |
| `this.context`              | 上下文对象，和组件里的 `useFlowContext()` 返回同一个对象  |
| `this.app`                  | Application 实例                                         |
| `this.app.eventBus`         | 应用级事件总线（`EventTarget`），用于监听生命周期事件     |

如果需要访问更多 NocoBase 能力（比如 `api`、`t`(i18n)、`logger`），可以通过 `this.context` 获取：

```ts
async load() {
  const { api, t, logger } = this.context;
}
```

更多上下文能力见 [Context 上下文](./ctx/index.md)。

## 相关链接

- [Router 路由](./router) — 注册页面路由和插件设置页
- [Component 组件开发](./component/index.md) — 路由挂载的 React 组件怎么写
- [Context 上下文](./ctx/index.md) — 通过上下文使用 NocoBase 内置能力
- [FlowEngine](./flow-engine/index.md) — 注册区块、字段、操作等可视化配置组件
- [编写第一个插件](../write-your-first-plugin.md) — 从零创建插件
