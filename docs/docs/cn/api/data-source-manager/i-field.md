---
title: "IField"
description: "NocoBase IField 接口：字段需实现的接口，定义字段属性与方法。"
keywords: "IField,接口,字段,Field,NocoBase"
---

# IField

`IField` 定义了字段需要实现的接口。

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


## 属性

### options

- **类型**：`FieldOptions`

