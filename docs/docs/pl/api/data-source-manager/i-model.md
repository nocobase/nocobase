# IModel

Interfejs `IModel` definiuje podstawowe właściwości i metody obiektu modelu.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Konwertuje obiekt modelu do formatu JSON.