# IModel

The `IModel` interface defines the basic properties and methods of a model object.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Converts the model object to JSON format.