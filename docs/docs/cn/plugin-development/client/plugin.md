# Plugin 插件

在 NocoBase 中，**客户端插件（Client Plugin）** 是扩展和定制前端功能的主要方式。通过继承 `@nocobase/client` 提供的 `Plugin` 基类，开发者可以在不同生命周期阶段注册逻辑、添加页面组件、扩展菜单或集成第三方功能。

## 插件类结构

一个最基本的客户端插件结构如下：

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // 插件被添加后执行
    console.log('Plugin added');
  }

  async beforeLoad() {
    // 在插件加载前执行
    console.log('Before plugin load');
  }

  async load() {
    // 插件加载时执行，注册路由、UI组件等
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## 生命周期说明

每个插件在浏览器刷新或应用初始化时都会依次经历以下生命周期：

| 生命周期方法 | 执行时机 | 说明 |
|--------------|-----------|------|
| **afterAdd()** | 插件被添加到插件管理器后立即执行 | 此时插件实例已创建，但并非所有插件都初始化完成。适合进行轻量初始化，例如读取配置或绑定基础事件。 |
| **beforeLoad()** | 在所有插件的 `load()` 之前执行 | 可以访问所有已启用的插件实例（`this.app.pm.get()`）。适合执行需要依赖其他插件的准备逻辑。 |
| **load()** | 插件加载时执行 | 所有插件的 `beforeLoad()` 执行完毕后执行此方法。适合注册前端路由、UI 组件等核心逻辑。 |

## 执行顺序

每次浏览器刷新时都会执行 `afterAdd()` → `beforeLoad()` → `load()`

## 插件上下文与 FlowEngine

从 NocoBase 2.0 开始，客户端的扩展 API 主要集中在 **FlowEngine** 中。在插件类中可以通过 `this.engine` 获取引擎实例。

```ts
// 在 load() 方法中访问引擎上下文
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

更多内容详见：  
- [FlowEngine](/flow-engine)  
- [Context](./context.md)
