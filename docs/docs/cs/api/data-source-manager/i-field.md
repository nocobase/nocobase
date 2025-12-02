:::tip Upozornění na překlad AI
Tato dokumentace byla automaticky přeložena umělou inteligencí.
:::


# IField

`IField` definuje rozhraní, které musí pole implementovat.

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

## Vlastnosti

### options

- **Typ**: `FieldOptions`