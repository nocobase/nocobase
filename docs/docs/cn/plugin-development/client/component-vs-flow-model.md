---
title: "Component vs FlowModel"
description: "NocoBase 开发选型指南：什么时候用普通 React 组件，什么时候用 FlowModel，能力差异、生命周期对比与场景选择。"
keywords: "Component,FlowModel,选型指南,React组件,可视化配置,模型树,NocoBase"
---

# Component vs FlowModel

在 NocoBase 插件开发中，写前端 UI 有两种方式：**普通 React 组件**和 **[FlowModel](../../flow-engine/index.md)**。两者不是互相替代的关系——FlowModel 是在 React 组件之上的一层封装，给组件加上了可视化配置的能力。

通常来说，你不需要纠结太久。问自己一个问题：

> **这个组件需要出现在 NocoBase 的「添加区块 / 字段 / 操作」菜单里，让用户在界面上进行可视化配置吗？**

- **不需要** → 用普通 React 组件，就是标准的 React 开发
- **需要** → 用 FlowModel 包装

## 默认方案：React 组件

大部分插件场景用普通 React 组件就够了。比如：

- 注册一个独立页面（插件设置页、自定义路由页面）
- 写一个弹窗、表单、列表等内部组件
- 封装一个工具类 UI 组件

这些场景下，用 React + Antd 写组件，通过 `useFlowContext()` 拿到 NocoBase 的上下文能力（发请求、国际化等），跟普通前端开发没有区别。

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MySettingsPage() {
  const ctx = useFlowContext();

  return (
    <div>
      <h2>{ctx.t('Plugin settings')}</h2>
      {/* 普通 React 组件，不需要 FlowModel */}
    </div>
  );
}
```

详细用法见 [Component 组件开发](./component/index.md)。

## 什么时候用 FlowModel

当你的组件需要满足以下条件时，用 FlowModel：

1. **出现在菜单里**：需要让用户通过「添加区块」「添加字段」「添加操作」菜单来添加
2. **支持可视化配置**：用户可以在界面上点击配置项来修改组件的属性（比如修改标题、切换显示模式）
3. **配置需要持久化**：用户的配置需要保存下来，下次打开页面时还在

简单来说，FlowModel 解决的是「让组件可配置、可持久化」的问题。如果你的组件不需要这些能力，就不需要用它。

## 二者的关系

FlowModel 不是用来"替代" React 组件的。它是在 React 组件之上的一层抽象：

```
React 组件：负责渲染 UI
    ↓ 包装
FlowModel：管理 props 来源、配置面板、配置持久化
```

一个 FlowModel 的 `render()` 方法里，写的就是普通的 React 代码。区别在于：普通组件的 props 是写死的或从父组件传入的，FlowModel 的 props 是通过 Flow（配置流程）动态生成的。

实际上，两者在基本结构上很相似：

```tsx pure
// React 组件
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}

// FlowModel
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

不过它们的管理方式完全不同。React 组件靠 JSX 嵌套形成**组件树**——这是运行时的 UI 渲染树。FlowModel 则由 [FlowEngine](../../flow-engine/index.md) 管理，形成**模型树**——一棵可持久化、可动态注册的逻辑结构树，通过 `setSubModel` / `addSubModel` 显式控制父子关系，适合构建页面区块、操作流、数据模型这类需要配置化管理的结构。

## 能力对比

从更技术的角度看二者的差异：

| 能力 | React 组件 | FlowModel |
| --- | --- | --- |
| 渲染 UI | `render()` | `render()` |
| 状态管理 | 内建 `state` / `setState` | 通过 `props` 和模型树结构管理 |
| 生命周期 | `constructor`、`componentDidMount`、`componentWillUnmount` | `onInit`、`onMount`、`onUnmount` |
| 响应输入变化 | `componentDidUpdate` | `onBeforeAutoFlows`、`onAfterAutoFlows` |
| 错误处理 | `componentDidCatch` | `onAutoFlowsError` |
| 子组件 | JSX 嵌套 | `setSubModel` / `addSubModel` 显式设置子模型 |
| 动态行为 | 事件绑定、状态更新 | 注册和派发 Flow |
| 持久化 | 无内建机制 | `model.save()` 等，和后端打通 |
| 多实例复用 | 需手动处理 | `createFork`——比如表格的每一行 |
| 引擎管理 | 无 | 由 FlowEngine 统一注册、加载、管理 |

如果你熟悉 React 的生命周期，FlowModel 的生命周期很容易映射过来——`onInit` 对应 `constructor`，`onMount` 对应 `componentDidMount`，`onUnmount` 对应 `componentWillUnmount`。

另外，FlowModel 还提供了一些 React 组件没有的能力：

- **`registerFlow`** — 注册 Flow，定义配置流程
- **`applyFlow` / `dispatchEvent`** — 执行或触发 Flow
- **`openFlowSettings`** — 打开 Flow 步骤的设置面板
- **`save` / `saveStepParams()`** — 持久化模型配置
- **`createFork`** — 一个模型逻辑被复用渲染多次（比如表格每行）

这些能力是支撑「可视化配置」体验的基础。如果你的场景不涉及可视化配置，不需要关心它们。详细用法见 [FlowEngine 完整文档](../../flow-engine/index.md)。

## 场景对照

| 场景 | 方案 | 原因 |
| --- | --- | --- |
| 插件设置页 | React 组件 | 独立页面，不需要出现在配置菜单里 |
| 工具类弹窗 | React 组件 | 内部组件，不需要可视化配置 |
| 自定义数据表格区块 | FlowModel | 需要出现在「添加区块」菜单，用户可以配置数据源 |
| 自定义字段展示组件 | FlowModel | 需要出现在字段配置里，用户可以选择展示方式 |
| 自定义操作按钮 | FlowModel | 需要出现在「添加操作」菜单里 |
| 封装一个图表组件给区块用 | React 组件 | 图表本身是内部组件，由 FlowModel 的区块来调用它 |

## 渐进式采用

不确定的时候，先用 React 组件实现功能。等确认需要可视化配置能力后，再用 FlowModel 包装——这是推荐的渐进式做法。大块内容用 FlowModel 管理，内部细节用 React 组件实现，两者配合使用。

## 相关链接

- [Component 组件开发](./component/index.md) — React 组件的写法和 useFlowContext 用法
- [FlowEngine 概述](./flow-engine/index.md) — FlowModel 基础用法和 registerFlow
- [FlowEngine 完整文档](../../flow-engine/index.md) — FlowModel、Flow、Context 的完整参考
