:::tip Pemberitahuan Terjemahan AI
Dokumentasi ini telah diterjemahkan secara otomatis oleh AI.
:::


# IField

`IField` mendefinisikan antarmuka yang perlu diimplementasikan oleh sebuah *field*.

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

## Properti

### options

- **Tipe**: `FieldOptions`