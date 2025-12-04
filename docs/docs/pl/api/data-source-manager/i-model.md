:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

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