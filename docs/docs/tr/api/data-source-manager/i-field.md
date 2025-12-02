:::tip Yapay Zeka Çeviri Bildirimi
Bu dokümantasyon yapay zeka tarafından otomatik olarak çevrilmiştir.
:::


# IField

`IField`, bir alanın uygulaması gereken arayüzü tanımlar.

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

## Özellikler

### options

- **Tip**: `FieldOptions`