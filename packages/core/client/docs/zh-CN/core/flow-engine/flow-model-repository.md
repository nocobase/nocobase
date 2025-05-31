# IFlowModelRepository

`IFlowModelRepository` 是 FlowEngine 的模型持久化接口，定义了模型的远程加载、保存和删除等操作。通过实现该接口，可以将模型的数据持久化到后端数据库、API 或其他存储介质，实现前后端的数据同步。

## 主要方法

- **load(uid: string): Promise<FlowModel \| null>**  
  根据唯一标识符 uid 从远程加载模型数据。

- **save(model: FlowModel): Promise<any>**  
  将模型数据保存到远程存储。

- **destroy(uid: string): Promise<boolean>**  
  根据 uid 从远程存储删除模型。

## FlowModelRepository 示例

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async load(uid: string) {
    // 实现：根据 uid 获取模型
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // 实现：保存模型
    return model;
  }

  async destroy(uid: string) {
    // 实现：根据 uid 删除模型
    return true;
  }
}
```

## 设置 FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## FlowEngine 提供的模型管理方法

### 本地方法

```ts
flowEngine.createModel(options); // 创建本地模型实例
flowEngine.getModel(uid);        // 获取本地模型实例
flowEngine.removeModel(uid);     // 移除本地模型实例
```

### 远程方法（由 ModelRepository 实现）

```ts
await flowEngine.loadModel(uid);     // 从远程加载模型
await flowEngine.saveModel(model);   // 保存模型到远程
await flowEngine.destroyModel(uid);  // 从远程删除模型
```

## model 实例方法

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // 保存到远程
await model.destroy();  // 从远程删除
```
