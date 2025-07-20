# FlowEngine 概览

FlowEngine 是一个强大的模型引擎，支持组件化、树形结构建模，适用于区块、操作、数据表等场景。

---

## 目录

* [从 FlowModel 开始](#从-flowmodel-开始)

  * [自定义 Model](#自定义-model)
  * [可用的 Model 基类](#可用的-model-基类)
* [注册 Model](#注册-model)
* [作为根 Model 节点使用](#作为根-model-节点使用)

  * [创建 Model 实例](#创建-model-实例)
  * [保存 Model（持久化）](#保存-model持久化)
  * [从远程仓库加载 Model](#从远程仓库加载-model)
  * [使用 loadOrCreateModel](#使用-loadorcreatemodel)
  * [渲染 Model](#渲染-model)
* [作为子 Model 节点使用](#作为子-model-节点使用)

  * [创建 SubModel 实例](#创建-submodel-实例)
  * [推荐使用 AddSubModelButton](#推荐使用-addsubmodelbutton-创建子-model)
  * [渲染 SubModel](#渲染-submodel)
  * [何时使用 SubModel](#什么时候需要-submodel)
* [作为 Fork Model 使用](#作为-fork-model-使用)
* [FlowModel API](#flowmodel-api)
* [FlowModel 与 React.Component 区别](#flowmodel-与-reactcomponent-区别)

---

## 从 FlowModel 开始

### 自定义 Model

```tsx | pure
class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloModel.</p>
      </div>
    );
  }
}
```

### 可用的 Model 基类

| 基类名称                    | 说明                       |
| ----------------------- | ------------------------ |
| `BlockModel`            | 所有区块的基类                  |
| `CollectionBlockModel`  | 数据表区块，继承自 BlockModel     |
| `ActionModel`           | 所有操作的基类                  |
| `CollectionActionModel` | 数据表操作，继承自 ActionModel    |
| `RecordActionModel`     | 数据表记录的操作，继承自 ActionModel |

---

## 注册 Model

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.flowEngine.registerModels({ HelloModel });
  }
}
```

---

## 作为根 Model 节点使用

### 创建 Model 实例

```ts
const model = flowEngine.createModel({
  use: 'HelloModel',
});
```

### 保存 Model（持久化）

```ts
await model.save();
```

> 说明：该方法将当前模型及其子模型结构保存到远程仓库中。

### 从远程仓库加载 Model

会加载整个模型树（包括子节点）：

```ts
await flowEngine.loadModel(uid);
```

### 使用 `loadOrCreateModel`

如果模型存在则加载，不存在则创建并保存：

```ts
await flowEngine.loadOrCreateModel(options);
```

### 渲染 Model

```tsx | pure
const model = await flowEngine.load(uid);
// 或
const model = await flowEngine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

---

## 作为子 Model 节点使用

### 创建 SubModel 实例

```ts
// 当有多个子模型时：
const subModel = model.addSubModel('subKey', options);

// 只有一个子模型时：
const subModel = model.setSubModel('subKey', options);
```

### 推荐使用 `<AddSubModelButton />` 创建子 Model

可以自动处理绑定和渲染逻辑。

### 渲染 SubModel

```tsx | pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

### 什么时候需要 SubModel？

当你需要在一个模型内部管理多个子组件或模块的属性和行为时，就需要使用 SubModel，例如嵌套布局、条件渲染等场景。

---

## 作为 Fork Model 使用

Fork 通常用于需要在多个位置渲染同一个模型模板（但状态独立）的场景，例如表格中的每一行。

```tsx | pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});

<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```

---

## FlowModel API

### 渲染

* `render()`
* `rerender()`

### 属性

* `props`
* `context`
* `parent`
* `subModels`

### 生命周期方法

* `onInit(options)`
* `onMount()`
* `onUnmount()`
* `beforeApplyAutoFlows(inputArgs)`
* `afterApplyAutoFlows(results, inputArgs)`
* `onApplyAutoFlowsError(error, inputArgs)`

### 属性和参数管理

* `setProps()`
* `getProps()`
* `setStepParams()`
* `getStepParams()`

### 子模型管理

* `mapSubModels`
* `findSubModel`
* `setSubModel`
* `addSubModel`

### 流管理

* `registerFlow`
* `dispatchEvent`
* `applyAutoFlows`

### 事件（emitter.on）

* `onSubModelAdded`
* `onSubModelRemoved`
* `onSubModelReplaced`
* `onSubModelMoved`
* `onResizeLeft`
* `onResizeRight`
* `onResizeBottom`
* `onResizeCorner`
* `onResizeEnd`

### Flow Settings

* `openStepSettingsDialog`
* `configureRequiredSteps`

### 元数据管理

* `static define()`
* `static defineChildren()`
* `title`

---

## FlowModel 与 React.Component 区别

### 📦 基本职责对比

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

### 🧬 生命周期对比

| 生命周期钩子 | `React.Component`                 | `FlowModel`                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| 初始化    | `constructor`、`componentDidMount` | `onInit`、`onMount`                           |
| 卸载     | `componentWillUnmount`            | `onUnmount`                                  |
| 响应输入   | `componentDidUpdate`              | `beforeApplyAutoFlows`、`afterApplyAutoFlows` |
| 错误处理   | `componentDidCatch`               | `onApplyAutoFlowsError`                      |

### 🧱 构建结构对比

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

### 🌲 模型树 vs 组件树

* **React 组件树**：运行时 JSX 嵌套形成的 UI 渲染树。
* **FlowModel 模型树**：由 FlowEngine 管理的逻辑结构树，可持久化、动态注册和控制子模型，适合构建页面区块、操作流、数据模型等。

### 🧠 特殊功能（FlowModel 特有）

| 功能                               | 说明                     |
| -------------------------------- | ---------------------- |
| `applyAutoFlows`                 | 自动触发已注册的流             |
| `registerFlow` / `dispatchEvent` | 支持流引擎事件处理             |
| `setSubModel` / `addSubModel`    | 显式控制子模型的创建与绑定          |
| `createFork`                     | 支持一个模型逻辑被复用渲染多次（如表格每行） |
| `loadModel` / `save()`           | 模型可持久化，与后端打通           |
| `configureRequiredSteps`         | 配置流步骤设置（如表单多步）        |

### ✅ 总结

| 项目   | React.Component | FlowModel              |
| ---- | --------------- | ---------------------- |
| 适合场景 | UI 层组件组织        | 数据驱动的流与区块管理           |
| 核心思想 | 声明式 UI          | 模型驱动的结构化流             |
| 管理方式 | React 控制生命周期    | FlowModel 控制模型生命周期与结构 |
| 优势   | 丰富生态和工具链        | 强结构化、流可持久化、子模型可控      |

> FlowModel 可以与 React 互补使用：在 FlowModel 中使用 React 渲染，而由 FlowEngine 管理其生命周期和结构。
