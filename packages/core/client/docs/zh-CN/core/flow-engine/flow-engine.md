# FlowEngine

`FlowEngine` 是 NocoBase 前端流引擎的核心调度与管理类，专为前端流自动化与业务逻辑编排设计。它负责流模型（Model）与操作（Action）的注册、生命周期管理、持久化、远程同步等，为前端场景下的流运行和扩展提供统一的环境与机制。

---

## 主要方法与属性

### Model 类注册与管理

- **registerModels(models: Record<string, ModelConstructor>): void**  
  批量注册模型类。

- **getModelClass(name: string): ModelConstructor | undefined**  
  获取已注册的模型类。

- **getModelClasses(): Map<string, ModelConstructor>**  
  获取所有已注册的模型类（构造函数）。返回一个 Map，key 为模型名称，value 为对应的模型类。常用于遍历、动态生成模型列表或批量操作等场景。

---

### Model 实例管理

- **createModel\<T extends FlowModel = FlowModel\>(options: CreateModelOptions): T**  
  创建并注册一个模型实例。如果指定 UID 已存在，则返回现有实例。支持泛型以确保正确的模型类型推导。

- **getModel\<T extends FlowModel = FlowModel\>(uid: string): T | undefined**  
  根据 UID 获取本地模型实例。

- **removeModel(uid: string): boolean**  
  销毁并移除一个本地模型实例。

---

### Model 持久化与远程操作

- **setModelRepository(modelRepository: IFlowModelRepository): void**  
  注入模型仓库（通常用于远程数据源/持久化适配器）。

- **async loadModel\<T extends FlowModel = FlowModel\>(uid: string): Promise\<T | null\>**  
  从远程仓库加载模型数据，并创建本地实例。如果模型不存在则返回 null。

- **async loadOrCreateModel\<T extends FlowModel = FlowModel\>(options: CreateModelOptions): Promise\<T | null\>**  
  从远程仓库加载模型，如果不存在则创建新模型实例并持久化。如果仓库未设置则返回 null。

- **async saveModel(model: FlowModel): Promise<any>**  
  保存模型到远程仓库。

- **async destroyModel(uid: string): Promise<boolean>**  
  从远程仓库删除模型，并移除本地实例。

---

### Action 注册与获取

- **registerAction\<TModel extends FlowModel = FlowModel\>(nameOrDefinition, options?): void**  
  注册一个 Action，可传入名称和选项，或完整的 ActionDefinition 对象。支持泛型以确保正确的模型类型推导。Action 是流中的可复用操作单元。

- **getAction\<TModel extends FlowModel = FlowModel\>(name: string): ActionDefinition\<TModel\> | undefined**  
  获取已注册的 Action 定义。支持泛型以确保正确的模型类型推导。

---

### Flow 注册

- **registerFlow\<TModel extends FlowModel = FlowModel\>(modelClassName: string, flowDefinition: FlowDefinition\<TModel\>): void**  
  注册一个 Flow 到指定的模型类。

---

### FlowSettings 管理

- **flowSettings.registerComponents(components): void**  
  添加组件到 flowSettings 的组件注册表中, 这些组件可以在 flow step 的 uiSchema 中使用。

- **flowSettings.registerScopes(scopes): void**  
  添加作用域到 flowSettings 的作用域注册表中, 这些作用域可以在 flow step 的 uiSchema 中使用。

- **flowSettings.load(): Promise\<void\>**  
  加载 FlowSettings 相关资源，未启用 FlowSettings 时可不调用。

- **flowSettings.openStepSettingsDialog(props: StepSettingsDialogProps)**  
  显示单个步骤的配置界面。

- **flowSettings.openRequiredParamsStepFormDialog(props: StepFormDialogProps)**  
  显示多个需要配置参数的步骤的分步表单界面。

#### 步骤上下文 (Step Context)

FlowSettings 为配置组件提供了上下文功能，使组件能够访问当前步骤的相关信息：

- **useStepSettingContext(): StepSettingContextType**  
  React Hook，用于在配置组件中获取当前步骤的上下文信息，包括：
  - `model`: 当前的 FlowModel 实例
  - `globals`: 全局上下文数据
  - `app`: FlowEngine 应用实例
  - `step`: 当前步骤定义
  - `flow`: 当前流程定义
  - `flowKey`: 流程标识
  - `stepKey`: 步骤标识

**使用示例：**
```typescript
import { useStepSettingContext } from '@nocobase/flow-engine';

const MyCustomSettingField = () => {
  const { model, step, flow, flowKey, stepKey } = useStepSettingContext();
  
  // 基于当前步骤信息进行自定义逻辑
  const handleAction = () => {
    console.log('当前步骤:', step.title);
    console.log('所属流程:', flow.title);
  };
  
  return <Input />;
};
```

**注意：**
- 在单步骤配置对话框中，上下文提供完整的步骤信息
- 在多步骤表单中，上下文会随着步骤切换动态更新
- 上下文同时也会添加到 SchemaField 的 scope 中，可在 uiSchema 中直接使用

---

## 示例

<code src="./demos/quickstart.tsx"></code>
