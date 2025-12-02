:::tip Thông báo dịch AI
Tài liệu này đã được dịch tự động bằng AI.
:::


# IField

`IField` định nghĩa giao diện mà một trường cần triển khai.

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

## Thuộc tính

### options

- **Kiểu**: `FieldOptions`