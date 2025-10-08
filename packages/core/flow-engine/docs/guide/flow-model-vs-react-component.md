# FlowModel vs React.Component

## 基本职责对比

| 特性/能力         | `React.Component`       | `FlowModel`                            |
| ------------- | ----------------------- | -------------------------------------- |
| 渲染能力          | 是，`render()` 方法生成 UI    | 是，`render()` 方法生成 UI                   |
| 状态管理          | 内建 `state` 和 `setState` | 使用 `props`，但状态管理更依赖模型树结构               |
| 生命周期          | 是，如 `componentDidMount` | 是，如 `onInit`、`onMount`、`onUnmount`     |
| 用途            | 构建 UI 组件                | 构建数据驱动、流化、结构化的“模型树”                   |
| 数据结构          | 组件树                     | 模型树（支持父子模型、多实例 Fork）                   |
| 子组件           | 使用 JSX 嵌套组件             | 使用 `setSubModel`/`addSubModel` 明确设置子模型 |
| 动态行为          | 事件绑定、状态更新驱动 UI          | 注册/派发 Flow、处理自动流                      |
| 持久化           | 无内建机制                   | 支持持久化（如 `model.save()`）                |
| 支持 Fork（多次渲染） | 否（需手动复用）                | 是（`createFork` 多实例化）                   |
| 引擎控制          | 无                       | 是，受 `FlowEngine` 管理、注册和加载              |

## 生命周期对比

| 生命周期钩子 | `React.Component`                 | `FlowModel`                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| 初始化    | `constructor`、`componentDidMount` | `onInit`、`onMount`                           |
| 卸载     | `componentWillUnmount`            | `onUnmount`                                  |
| 响应输入   | `componentDidUpdate`              | `onBeforeAutoFlows`、`onAfterAutoFlows` |
| 错误处理   | `componentDidCatch`               | `onAutoFlowsError`                      |

## 构建结构对比

**React：**

```tsx | pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel：**

```tsx | pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## 组件树 vs 模型树

* **React 组件树**：运行时 JSX 嵌套形成的 UI 渲染树。
* **FlowModel 模型树**：由 FlowEngine 管理的逻辑结构树，可持久化、动态注册和控制子模型，适合构建页面区块、操作流、数据模型等。

## 特殊功能（FlowModel 特有）

| 功能                               | 说明                     |
| -------------------------------- | ---------------------- |
| `registerFlow`                 | 注册流             |
| `applyFlow` / `dispatchEvent` | 执行/触发流             |
| `setSubModel` / `addSubModel`         | 显式控制子模型的创建与绑定          |
| `createFork`                          | 支持一个模型逻辑被复用渲染多次（如表格每行） |
| `openFlowSettings`                    | 流步骤设置 |
| `save` / `saveStepParams()`           | 模型可持久化，与后端打通           |

## 总结

| 项目   | React.Component | FlowModel              |
| ---- | --------------- | ---------------------- |
| 适合场景 | UI 层组件组织        | 数据驱动的流与区块管理           |
| 核心思想 | 声明式 UI          | 模型驱动的结构化流             |
| 管理方式 | React 控制生命周期    | FlowModel 控制模型生命周期与结构 |
| 优势   | 丰富生态和工具链        | 强结构化、流可持久化、子模型可控      |

> FlowModel 可以与 React 互补使用：在 FlowModel 中使用 React 渲染，而由 FlowEngine 管理其生命周期和结构。
