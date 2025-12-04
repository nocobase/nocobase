:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# IField

`IField` definieert de interface die een veld moet implementeren.

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

## Eigenschappen

### options

- **Type**: `FieldOptions`