:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# IField

`IField` definierar gränssnittet som ett fält behöver implementera.

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

## Egenskaper

### options

- **Typ**: `FieldOptions`