:::tip AI翻訳のお知らせ
本ドキュメントはAIにより自動翻訳されています。
:::

# IField

`IField` は、フィールドが実装する必要があるインターフェースを定義します。

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

## プロパティ

### options

- **型**：`FieldOptions`