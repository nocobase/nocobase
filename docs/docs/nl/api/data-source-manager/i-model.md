# IModel

De `IModel` interface definieert de basis eigenschappen en methoden van een modelobject.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Converteert het modelobject naar JSON-formaat.