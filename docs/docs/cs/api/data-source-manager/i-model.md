:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


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