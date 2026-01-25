# 创建 FlowModel

## 作为根节点

### 构建 FlowModel 实例

在本地构建一个实例

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### 保存 FlowModel

构建的实例如果需要持久化时，可以通过 save 方法保存。

```ts
await model.save();
```

### 从远程仓库加载 FlowModel

已经保存的 model，可以通过 loadModel 加载，这个方法会加载整个模型树（包括子节点）：

```ts
await engine.loadModel(uid);
```

### 加载或创建 FlowModel

如果模型存在则加载，不存在则创建并保存。

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### 渲染 FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## 作为子节点

当你需要在一个模型内部管理多个子组件或模块的属性和行为时，就需要使用 SubModel，例如嵌套布局、条件渲染等场景。

### 创建 SubModel

推荐使用 `<AddSubModelButton />`

可以自动处理子 Model 的添加、绑定、存储等问题，详见 [AddSubModelButton 使用说明](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model)。

### 渲染 SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## 作为 ForkModel

Fork 通常用于需要在多个位置渲染同一个模型模板（但状态独立）的场景，例如表格中的每一行。

### 创建 ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### 渲染 ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```
