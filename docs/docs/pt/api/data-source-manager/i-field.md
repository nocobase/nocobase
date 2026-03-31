:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# IField

`IField` define a interface que um campo precisa implementar.

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

## Propriedades

### options

- **Tipo**: `FieldOptions`