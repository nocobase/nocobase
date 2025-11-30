# IModel

L'interfaccia `IModel` definisce le proprietà e i metodi di base di un oggetto modello.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Converte l'oggetto modello in formato JSON.