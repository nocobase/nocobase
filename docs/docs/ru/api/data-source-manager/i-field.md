:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# IField

`IField` определяет интерфейс, который должно реализовать поле.

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

## Свойства

### options

- **Тип**: `FieldOptions`