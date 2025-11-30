# IModel

Rozhraní `IModel` definuje základní vlastnosti a metody objektu modelu.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Převede objekt modelu do formátu JSON.