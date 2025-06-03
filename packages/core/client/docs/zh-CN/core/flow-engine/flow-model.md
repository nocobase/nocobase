# FlowModel

`FlowModel` 是 NocoBase 流程引擎的基础模型类，支持流程注册、流程执行、属性管理、子模型管理、持久化等功能。所有业务模型均可继承自 FlowModel。

---

## 主要属性

- **uid: string**  
  模型唯一标识符。

- **props: IModelComponentProps**  
  组件属性，支持响应式。

- **stepParams: StepParams**  
  流程步骤参数。

- **flowEngine: FlowEngine**  
  关联的流程引擎实例。

- **parent: FlowModel \| null**  
  父模型实例。

---

## 主要方法

### 生命周期与初始化

- **constructor(options)**  
  创建模型实例，初始化 uid、props、stepParams、子模型等。

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
  支持多种重载，设置流程步骤参数。

- **getStepParams(...)**  
  支持多种重载，获取流程步骤参数。

---

### 流程注册与执行

- **static registerFlow(keyOrDefinition, flowDefinition?)**  
  配置流程，支持字符串 key 或完整对象。

- **applyFlow(flowKey: string, context?): Promise<any>**  
  执行指定流程。

- **dispatchEvent(eventName: string, context?): void**  
  触发事件，自动匹配并执行相关流程。

- **applyAutoFlows(context?): Promise<any[]>**  
  执行所有自动应用流程。

- **getFlow(key: string): FlowDefinition \| undefined**  
  获取指定 key 的流程配置。

- **static getFlows(): Map<string, FlowDefinition>**  
  获取所有已配置流程（含继承）。

---

### 子模型管理

- **addSubModel(sub: string, options): FlowModel**  
  创建并添加一个子模型到数组字段（如 tabs、columns）。

- **setSubModel(sub: string, options): FlowModel**  
  创建并设置一个子模型到对象字段（如 detail、config）。

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

// 为 MyModel 配置流程
MyModel.registerFlow({ key: 'default', steps: { ... } });

// 创建实例
const model = flowEngine.createModel({ use: 'MyModel', props: { name: 'Demo' } });

// 添加子模型
model.addSubModel('tabs', { use: 'TabFlowModel', props: { label: 'Tab1' } });

// 持久化
await model.save();

// 执行流程
await model.applyFlow('default');
await model.applyAutoFlows();
await model.dispatchEvent('event');
```
