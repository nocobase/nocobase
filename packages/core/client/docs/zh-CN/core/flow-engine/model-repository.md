# IModelRepository

## ModelRepository 示例

```ts
class ModelRepository implements IModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async get(uid: string) {
    // 实现：根据 uid 获取模型
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // 实现：保存模型
    return model;
  }

  async delete(uid: string) {
    // 实现：根据 uid 删除模型
    return true;
  }
}
```

## 设置 ModelRepository

```ts
flowEngine.setModelRepository(new ModelRepository(this.app));
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
await model.save();    // 保存到远程
await model.delete();  // 从远程删除
```

<code src="./demos/model-repository.tsx"></code>
