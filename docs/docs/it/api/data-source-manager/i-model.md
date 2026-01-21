:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

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