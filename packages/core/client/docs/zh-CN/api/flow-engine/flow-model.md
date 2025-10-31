# FlowModel

`FlowModel` 是 NocoBase 流引擎的基础模型类，支持流注册、流执行、属性管理、子模型管理、持久化等功能。所有业务模型均可继承自 FlowModel。

---

## 主要属性

- **uid: string**  
  模型唯一标识符。

- **sortIndex: number**  
  排序索引。

- **title: string**  
  模型标题，用于界面展示，例如区块标题。

- **props: IModelComponentProps**  
  组件属性，支持响应式。

- **stepParams: StepParams**  
  流步骤参数。

- **flowEngine: FlowEngine**  
  关联的流引擎实例。

- **parent: Structure['parent']**  
  父模型实例，类型由泛型 Structure 决定。默认为 `FlowModel | null`。

- **subModels: Structure['subModels']**  
  子模型集合，类型由泛型 Structure 决定。默认为 `Record<string, FlowModel | FlowModel[]>`。
  支持对象字段（如 detail、config）和数组字段（如 tabs、columns）。

---

## 主要方法

### 生命周期与初始化

- **constructor(options)**  
  创建模型实例，初始化 uid、props、stepParams、subModels 等。

- **onInit(options): void**  
  可被子类重写的初始化钩子。

---

### 属性与参数管理

- **setProps(props: IModelComponentProps): void**  
  批量设置属性。

- **setProps(key: string, value: any): void**  
  设置单个属性。

- **getProps(): ReadonlyModelProps**  
  获取只读属性。

- **setStepParams(...)**  
  支持多种重载，设置流步骤参数。

- **getStepParams(...)**  
  支持多种重载，获取流步骤参数。

- **setTitle(value: string)**  
  设置模型标题，能够为各个模型设置不同的标题。

---

### 流注册与执行

- **static registerFlow\<TModel\>(keyOrDefinition, flowDefinition?)**  
  配置流，支持字符串 key 或完整对象。支持泛型以确保类型安全。

- **applyFlow(flowKey: string, inputArgs?: Record<string, any>): Promise\<any\>**  
  执行指定流。

- **dispatchEvent(eventName: string, inputArgs?: Record<string, any>, options?: { debounce?: boolean; sequential?: boolean; useCache?: boolean }): Promise<any[]>**  
  触发事件并执行匹配的流；支持顺序或并行执行。
  - `sequential`: 是否顺序执行（默认并行）；beforeRender 的默认值为顺序执行（可覆盖）。
  - `useCache`: 是否启用事件层面的缓存（默认 `false`）；beforeRender 的默认值为启用缓存（可覆盖）。
  - `debounce`: 是否启用防抖（默认 `false`）。

- **applySubModelsBeforeRenderFlows(subKey: string, inputArgs?: Record\<string, any\>): Promise\<void\>**  
  对指定子模型派发 `beforeRender` 事件（内部顺序执行并使用缓存）。

- **getFlow(key: string): FlowDefinition \| undefined**  
  获取指定 key 的流配置。

- **getFlows(): Map\<string, FlowDefinition\>**  
  获取所有已配置流（含继承）。

- **getEventFlows(eventName: string): FlowDefinition[]**  
  按事件名获取流程集合并按 sort 排序。
  - 特殊事件 `beforeRender`: 兼容包含“未声明 on 且 manual !== true”的流程。

---

### 事件分发钩子

- **async onDispatchEventStart(eventName: string, options?: DispatchEventOptions, inputArgs?: Record<string, any>)**
  事件执行前调用；beforeRender 可通过抛出 `FlowExitException` 终止执行。

- **async onDispatchEventEnd(eventName: string, options?: DispatchEventOptions, inputArgs?: Record<string, any>, results?: any[])**
  事件执行后调用；`results` 为按 sort 顺序收集到的步骤结果数组。

- **async onDispatchEventError(eventName: string, options?: DispatchEventOptions, inputArgs?: Record<string, any>, error?: Error)**
  事件执行或生命周期钩子出错时调用。

---

### 步骤设置

- **openStepSettingsDialog(flowKey: string, stepKey: string)**  
  打开步骤设置对话框。

- **async configureRequiredSteps(dialogWidth?: number | string, dialogTitle?: string): Promise\<any\>**  
  配置必填步骤参数。用于在一个分步表单中配置所有需要参数的步骤。
  - `dialogWidth`: 对话框宽度，默认为 800
  - `dialogTitle`: 对话框标题，默认为 '步骤参数配置'
  - 返回表单提交的值

---

### 子模型管理

- **setSubModel(subKey: string, options): FlowModel**  
  创建并设置一个子模型到对象字段（如 detail、config）。

- **addSubModel(subKey: string, options): FlowModel**  
  创建并添加一个子模型到数组字段（如 tabs、columns）。

- **findSubModel\<K, R\>(subKey: K, callback: (model) => R): R**  
  查找子模型

- **mapSubModels\<K, R\>(subKey: K, callback: (model) => R): R[]**  
  遍历指定 key 的子模型，对每个子模型执行 callback 函数，并返回结果数组。
  - 支持完整的类型推导，callback 参数会自动推导为正确的模型类型
  - 如果子模型不存在，返回 null
  - 自动处理单个模型和模型数组的情况

- **setParent(parent: FlowModel): void**  
  设置父模型。

- **moveTo(targetModel: FlowModel): boolean**  
  将当前模型移动到目标模型的位置。要求两个模型有相同的父模型且都在数组类型的子模型集合中。
  - 返回 `true` 表示移动成功
  - 返回 `false` 表示移动失败（会输出错误日志）

- **createRootModel(options): FlowModel**  
  通过 flowEngine 创建根模型。

---

### 持久化与销毁

- **serialize(): Record\<string, any\>**  
  序列化当前模型及其所有子模型，返回可持久化的数据结构。

- **async save(): Promise\<any\>**  
  保存模型到远程。

- **async destroy(): Promise\<any\>**  
  删除模型。

- **remove(): void**  
  从本地移除当前模型实例（仅移除，不销毁数据）。

---

### 渲染

- **render(): React.ReactNode | Function**  
  渲染模型的 React 组件，默认返回空 div，建议子类重写。

### 配置UI时，FlowModel为hidden状态时渲染（renderHiddenInConfig）

- **protected renderHiddenInConfig(): React.ReactNode | undefined**
  当 `flowSettings.enabled === true` 且 `model.hidden === true` 时调用，用于在“设计模式”下替代正常渲染；非设计模式下切 hidden 为 true 时直接不渲染（返回 null）。

---

## 主要示例

```ts
class MyModel extends FlowModel {
  onInit(options) {
    // 初始化逻辑
  }
  render() {
    return <div>{this.props.name}</div>;
  }
}

// 为 MyModel 配置流
MyModel.registerFlow({ key: 'default', steps: { ... } });

// 创建实例
const model = flowEngine.createModel({ use: 'MyModel', props: { name: 'Demo' } });

// 添加子模型
model.addSubModel('tabs', { use: 'TabFlowModel', props: { label: 'Tab1' } });

// 持久化
await model.save();

// 执行流
await model.applyFlow('default');
await model.dispatchEvent('beforeRender');
await model.dispatchEvent('event');
```

### 泛型支持

FlowModel 支持泛型，可以通过类型参数定义模型的结构，提供更好的类型安全和智能提示。

#### 基本泛型用法

```ts
interface MyModelStructure {
  parent?: ParentModel;
  subModels?: {
    tabs?: TabModel[];
    items?: ItemModel[];
  };
}

class MyModel extends FlowModel<MyModelStructure> {
  // 现在 this.parent 和 this.subModels 都有正确的类型推导
}
```

#### 默认结构类型

如果不指定泛型参数，FlowModel 使用默认的 `DefaultStructure`：

```ts
interface DefaultStructure {
  parent?: FlowModel | null;
  subModels?: Record<string, FlowModel | FlowModel[]>;
}
```
- **invalidateFlowCache(eventName?: string, deep?: boolean): void**  
  失效当前模型指定事件的流程缓存；未指定 `eventName` 时失效当前模型的全部事件缓存。常用：`invalidateFlowCache('beforeRender')`。
