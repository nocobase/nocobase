# IModel

La interfaz `IModel` define las propiedades y métodos básicos de un objeto de modelo.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Convierte el objeto de modelo a formato JSON.