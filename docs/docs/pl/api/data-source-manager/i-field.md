:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# IField

`IField` definiuje interfejs, który musi zaimplementować pole.

```typescript
export type FieldOptions = {
  name: string;
  field: string;
  rawType: string;
  type: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
  possibleTypes?: string[];
  defaultValue?: any;
  primaryKey: boolean;
  unique: boolean;
  allowNull?: boolean;
  autoIncrement?: boolean;
  [key: string]: any;
};

export interface IField {
  options: FieldOptions;
}
```

## Właściwości

### options

- **Typ**: `FieldOptions`