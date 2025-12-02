:::tip AI-översättningsmeddelande
Denna dokumentation har översatts automatiskt av AI.
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