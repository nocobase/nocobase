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

## 示例

<code src="./demos/quickstart.tsx"></code>
