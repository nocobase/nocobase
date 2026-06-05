# FlowModel Persistence

FlowEngine provides a complete persistence system.


![20251008231338](https://static-docs.nocobase.com/20251008231338.png)


## IFlowModelRepository

`IFlowModelRepository` is the model persistence interface for FlowEngine, defining operations such as remote loading, saving, and deleting of models. By implementing this interface, model data can be persisted to a backend database, API, or other storage media, enabling data synchronization between the frontend and backend.

### Main Methods

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Loads model data from a remote source based on the unique identifier `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Saves the model data to remote storage.

- **destroy(uid: string): Promise<boolean\>**  
  Deletes the model from remote storage based on `uid`.

### FlowModelRepository Example

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implementation: Get model by uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implementation: Save model
    return model;
  }

  async destroy(uid: string) {
    // Implementation: Delete model by uid
    return true;
  }
}
```

### Set FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Model Management Methods Provided by FlowEngine

### Local Methods

```ts
flowEngine.createModel(options); // Create a local model instance
flowEngine.getModel(uid);        // Get a local model instance
flowEngine.removeModel(uid);     // Remove a local model instance
```

### Remote Methods (Implemented by ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Load model from remote
await flowEngine.saveModel(model);   // Save model to remote
await flowEngine.destroyModel(uid);  // Delete model from remote
```

## model Instance Methods

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Save to remote
await model.destroy();  // Delete from remote
```