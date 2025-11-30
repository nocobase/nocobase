# IModel

A interface `IModel` define as propriedades e métodos básicos de um objeto de modelo.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Converte o objeto de modelo para o formato JSON.