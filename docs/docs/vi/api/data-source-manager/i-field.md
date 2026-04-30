---
title: "IField"
description: "Interface IField của NocoBase: interface field cần triển khai, định nghĩa thuộc tính và phương thức của field."
keywords: "IField,interface,field,Field,NocoBase"
---

# IField

`IField` định nghĩa interface mà field cần triển khai.

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

