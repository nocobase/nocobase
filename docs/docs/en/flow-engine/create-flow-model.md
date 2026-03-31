# Create FlowModel

## As a Root Node

### Build a FlowModel Instance

Build an instance locally

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Save FlowModel

When a built instance needs to be persisted, it can be saved using the save method.

```ts
await model.save();
```

### Load FlowModel from Remote

A saved model can be loaded using loadModel. This method will load the entire model tree (including child nodes):

```ts
await engine.loadModel(uid);
```

### Load or Create FlowModel

If the model exists, it will be loaded; otherwise, it will be created and saved.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Render FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## As a Child Node

When you need to manage the properties and behaviors of multiple sub-components or modules within a model, you need to use SubModel, such as in scenarios like nested layouts, conditional rendering, etc.

### Create SubModel

It is recommended to use `<AddSubModelButton />`

It can automatically handle issues such as adding, binding, and storing child Models. For details, see [AddSubModelButton Usage Instructions](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Render SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## As a ForkModel

Fork is typically used in scenarios where the same model template needs to be rendered in multiple locations (but with independent states), such as each row in a table.

### Create ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Render ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```