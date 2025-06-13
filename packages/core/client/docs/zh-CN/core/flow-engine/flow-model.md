# FlowModel

`FlowModel` 是 NocoBase 流引擎的基础模型类，支持流注册、流执行、属性管理、子模型管理、持久化等功能。所有业务模型均可继承自 FlowModel。

## 泛型支持

FlowModel 支持泛型，可以通过类型参数定义模型的结构，提供更好的类型安全和智能提示。

### 基本泛型用法

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

### 默认结构类型

如果不指定泛型参数，FlowModel 使用默认的 `DefaultStructure`：

```ts
interface DefaultStructure {
  parent?: FlowModel | null;
  subModels?: Record<string, FlowModel | FlowModel[]>;
}
```

---

## 主要属性

- **uid: string**  
  模型唯一标识符。

- **sortIndex: number**  
  排序索引。

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

---

### 流注册与执行

- **static registerFlow\<TModel\>(keyOrDefinition, flowDefinition?)**  
  配置流，支持字符串 key 或完整对象。支持泛型以确保类型安全。

- **static extendFlow\<TModel\>(keyOrDefinition, extendDefinition?)**  
  扩展已存在的流程定义，通过合并现有流程和扩展定义来创建新的流程。

- **applyFlow(flowKey: string, extra?: FlowExtraContext): Promise<any>**  
  执行指定流。

- **dispatchEvent(eventName: string, extra?: FlowExtraContext): void**  
  触发事件，自动匹配并执行相关流。

- **applyAutoFlows(extra?: FlowExtraContext): Promise<any[]>**  
  执行所有自动应用流。

- **getFlow(key: string): FlowDefinition \| undefined**  
  获取指定 key 的流配置。

- **static getFlows(): Map<string, FlowDefinition>**  
  获取所有已配置流（含继承）。

- **getAutoFlows(): FlowDefinition[]**  
  获取所有自动应用流程定义并按 sort 排序。

---

### 步骤设置

- **openStepSettingsDialog(flowKey: string, stepKey: string)**  
  打开步骤设置对话框。

- **async configureRequiredSteps(dialogWidth?: number | string, dialogTitle?: string): Promise<any>**  
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

- **mapSubModels<K, R>(subKey: K, callback: (model) => R): R[]**  
  遍历指定 key 的子模型，对每个子模型执行 callback 函数，并返回结果数组。
  - 支持完整的类型推导，callback 参数会自动推导为正确的模型类型
  - 如果子模型不存在，返回 null
  - 自动处理单个模型和模型数组的情况

- **setParent(parent: FlowModel): void**  
  设置父模型。

- **createRootModel(options): FlowModel**  
  通过 flowEngine 创建根模型。

---

### 持久化与销毁

- **async save(): Promise<any>**  
  保存模型到远程。

- **async destroy(): Promise<any>**  
  删除模型。

---

### 渲染

- **render(): React.ReactNode | Function**  
  渲染模型的 React 组件，默认返回空 div，建议子类重写。

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
await model.applyAutoFlows();
await model.dispatchEvent('event');
```
