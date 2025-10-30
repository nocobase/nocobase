# 客户端概述

本章介绍 NocoBase 客户端插件的基本结构与工作机制，包括目录结构、生命周期、常用 API、前端流引擎（FlowModel）以及资源与数据源体系，帮助你在插件中扩展和定制前端行为与逻辑。

---

## 📁 目录结构概览

当你创建一个插件时，客户端相关代码通常放在 `src/client` 目录中，目录结构如下：

```bash
├─ /packages/plugins/@my-project/plugin-hello
│  ├─ client.d.ts                   # 类型声明文件
│  ├─ client.js                     # 构建产物，插件加载入口
│  └─ src
│     ├─ index.ts                   # 默认导出 client 插件
│     ├─ client
│     │  ├─ index.tsx               # 默认导出 Plugin 类
│     │  ├─ plugin.tsx              # 插件类（继承自 @nocobase/client Plugin）
│     │  ├─ models                  # 可选：注册前端模型（如 FlowModel）
│     │  │  └─ index.ts
│     │  └─ utils                   # 可选：插件工具函数
│     │     ├─ index.ts
│     │     └─ useT.ts              # 国际化辅助函数
│     ├─ utils                      # 插件通用工具
│     │  ├─ index.ts
│     │  └─ tExpr.ts
│     └─ locale                     # 可选：多语言文件
│        ├─ en-US.json
│        └─ zh-CN.json
```

> 💡 `client.js` 是插件构建产物，会在插件启用时被加载。开发阶段主要关注 `src/client` 下的源码。

---

## 🔄 Plugin 类与生命周期

客户端插件需继承 `@nocobase/client` 提供的 `Plugin` 基类，提供三个主要生命周期钩子：

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // 插件添加后执行（初始化实例）
  }

  async beforeLoad() {
    // 插件加载前执行（所有插件已实例化）
  }

  async load() {
    // 插件加载时执行（所有插件的 beforeLoad 已完成）
  }
}

export default PluginHelloClient;
```

### 生命周期执行顺序

每次页面刷新或应用启动，插件生命周期依次为：

```
afterAdd → beforeLoad → load
```

| 生命周期           | 时机           | 注意事项                        |
| -------------- | ------------ | --------------------------- |
| `afterAdd()`   | 插件实例创建后      | ❗ 不可访问其他插件                  |
| `beforeLoad()` | 加载前，所有插件已初始化 | ✅ 可通过 `pm.get(name)` 获取其他插件 |
| `load()`       | 插件加载完成后      | ✅ 所有插件的 `beforeLoad` 已执行    |

---

## 🧩 客户端插件体系结构

客户端插件通过 `Plugin` 实例可访问一系列功能对象：

| 属性 / 方法          | 说明                    |
| ---------------- | --------------------- |
| `plugin.logger`  | 插件日志器                 |
| `plugin.pm`      | 插件管理器（Plugin Manager） |
| `plugin.context` | 插件上下文                 |
| `plugin.engine`  | 前端流引擎                 |
| `plugin.router`  | 页面路由系统                |
| `plugin.t()`     | 国际化函数（同 i18next）      |

---

## 🌐 客户端上下文（Context）

Context 提供插件运行时的上下文环境。常见的上下文类包括：

| Context 类              | 用途                |
| ---------------------- | ----------------- |
| `FlowContext`          | 前端流执行上下文          |
| `FlowEngineContext`    | 流引擎运行上下文          |
| `FlowRunjsContext`     | 执行 `runjs` 节点的上下文 |
| `FlowModelContext`     | 流模型执行上下文          |
| `FlowForkModelContext` | 流模型分支上下文          |
| `FlowRuntimeContext`   | 流引擎的完整运行时上下文      |

### 常用 Context API：

| 方法                         | 说明                      |
| -------------------------- | ----------------------- |
| `ctx.engine`               | 获取前端流引擎实例               |
| `ctx.router`               | 页面级路由对象                 |
| `ctx.pluginSettingsRouter` | 插件设置页面路由                |
| `ctx.request`              | 发起网络请求的封装工具             |
| `ctx.createResource()`     | 创建远程资源对象（REST 接口封装）     |
| `ctx.i18n`                 | 国际化对象                   |
| `ctx.logger`               | 日志                      |
| `ctx.t()`                  | 翻译函数（与 `plugin.t()` 相同） |
| `ctx.dataSourceManager`    | 数据源管理器                  |
| `ctx.jsonLogic`            | JSON Logic 执行器          |

---

## 🔁 前端流引擎（FlowEngine）

NocoBase 提供了一个面向低代码场景的**前端流引擎**，用于配置和执行组件行为逻辑，如：

* 按钮点击 → 请求接口 → 显示提示
* 字段值变更 → 控制另一个字段的可见性
* 页面加载时 → 执行一组初始化逻辑

### FlowModel 是什么？

`FlowModel` 是前端流引擎的核心类，是构建这些组件逻辑的起点。你可以通过继承它来注册属于你插件的前端流模型。

通常注册方式如下：

```ts
// src/client/models/custom-flow.ts
import { FlowModel } from '@nocobase/client';

export class CustomFlowModel extends FlowModel {
  // 自定义流程结构与执行逻辑
}
```

```ts
// src/client/models/index.ts
export const models = {
  CustomFlowModel,
};
```

### 定义结构（Definitions）

前端流模型由一组可组合定义（Definition）构成：

| 定义类                | 描述                    |
| ------------------ | --------------------- |
| `ModelDefinition`  | 所有定义的基类               |
| `FlowDefinition`   | 描述整体流结构               |
| `EventDefinition`  | 定义触发事件（如 onClick）     |
| `ActionDefinition` | 定义执行动作（如 API 请求、字段赋值） |
| `StepDefinition`   | 定义事件与动作之间的流程步骤        |

---

## 🔗 Resource

NocoBase 客户端封装了一套统一的资源调用系统，可简洁地进行 API 调用、数据获取、分页等操作。

### 常见资源类型：

| 类型                     | 用途          |
| ---------------------- | ----------- |
| `FlowResource`         | 前端流引擎资源     |
| `APIResource`          | REST API 封装 |
| `BaseRecordResource`   | 基础记录资源      |
| `MultiRecordResource`  | 多条记录资源      |
| `SingleRecordResource` | 单条记录资源      |
| `SQLResource`          | SQL 查询资源    |
| `ChartResource`        | 图表数据资源封装    |

---

## 🧱 数据源体系

客户端通过 `DataSourceManager` 管理所有数据源，支持自定义 Collection 与字段。

| 模块                  | 说明        |
| ------------------- | --------- |
| `DataSourceManager` | 管理所有数据源连接 |
| `DataSource`        | 表示一个数据源实例 |
| `Collection`        | 表结构定义     |
| `CollectionField`   | 字段定义结构    |

---

## 📚 详细教程

### 核心功能

- **[FlowEngine 流引擎](./flow-engine.md)** - 前端流引擎的详细用法和最佳实践
- **[数据源系统](./data-sources.md)** - 数据源管理的完整指南
- **资源系统** - 资源类型和操作的详细说明
- **[路由系统](./router.md)** - 路由管理和页面导航

### UI 组件

- **区块系统** - 区块模型的开发指南
- **操作系统** - 操作模型的开发指南
- **字段系统** - 字段模型的开发指南

### 高级功能

- **上下文系统** - 上下文体系详解
- **Hooks 系统** - React Hooks 的使用
- **[样式和主题](./styles-and-theme.md)** - 样式管理和主题定制
- **[测试指南](./tests.md)** - 测试策略和工具使用

### 完整教程

- **教程大纲** - 完整的客户端开发教程大纲

## 🚀 学习路线推荐

建议按以下路径逐步深入客户端开发：

1. 熟悉插件目录与生命周期（`Plugin` 类）
2. 掌握常用 API 和 Context 体系
3. 使用和扩展前端 `FlowModel`
4. 使用 Resource 进行数据交互
5. 编写配置页面与自定义行为逻辑

📷 示例图：

![学习路线图](https://static-docs.nocobase.com/20250929072438.png)

## 进一步学习

- 初次编写插件可先完成《[编写第一个插件](../write-your-first-plugin)》中的示例
- 了解服务端插件能力，请阅读《[服务端概述](../server/index)》
- 深入 API 可查阅 `@nocobase/client` 包中的类型定义与示例代码
- 查看《教程大纲》了解完整的客户端开发指南
