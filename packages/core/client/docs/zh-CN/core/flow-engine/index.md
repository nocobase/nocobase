# FlowEngine

`FlowEngine` 是 NocoBase 流程引擎的核心类，负责模型（Model）和动作（Action）的注册、实例管理、流程定义、数据持久化等功能。

---

## 主要方法与属性

### Model 类注册与管理

- **registerModels(models: Record<string, ModelConstructor>): void**  
  批量注册模型类。

- **registerModelClass(name: string, modelClass: ModelConstructor): void**  
  注册一个模型类（构造函数）。

- **getModelClass(name: string): ModelConstructor | undefined**  
  获取已注册的模型类。

---

### Model 实例管理

- **createModel(options: CreateModelOptions): FlowModel**  
  创建并注册一个模型实例。如果指定 UID 已存在，则返回现有实例。

- **getModel(uid: string): FlowModel | undefined**  
  根据 UID 获取本地模型实例。

- **removeModel(uid: string): boolean**  
  销毁并移除一个本地模型实例。

---

### Model 持久化与远程操作

- **setModelRepository(modelRepository: IModelRepository): void**  
  注入模型仓库（通常用于远程数据源/持久化适配器）。

- **async loadModel(uid: string): Promise<FlowModel \| null>**  
  从远程仓库加载模型数据，并创建本地实例。

- **async saveModel(model: FlowModel): Promise<any>**  
  保存模型到远程仓库。

- **async destroyModel(uid: string): Promise<boolean>**  
  从远程仓库删除模型，并移除本地实例。

---

### Action 注册与获取

- **registerAction(nameOrDefinition, options?): void**  
  注册一个 Action，可传入名称和选项，或完整的 ActionDefinition 对象。

- **getAction(name: string): ActionDefinition \| undefined**  
  获取已注册的 Action 定义。

## 主要示例

```ts
const flowEngine = new FlowEngine();

// 注册模型类
flowEngine.registerModels({ MyModel });

// 创建模型实例
const model = flowEngine.createModel({ use: 'MyModel', props: { ... } });

// 获取本地模型
const sameModel = flowEngine.getModel(model.uid);

// 持久化操作
flowEngine.setModelRepository(new ModelRepository());
await flowEngine.saveModel(model);
const loaded = await flowEngine.loadModel(model.uid);

// 删除模型
await flowEngine.destroyModel(model.uid);

// 注册 Action
flowEngine.registerAction('myAction', { handler: async (ctx, model, params) => { ... } });
```
