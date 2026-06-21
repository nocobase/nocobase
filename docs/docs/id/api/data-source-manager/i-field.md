---
title: "IField"
description: "Interface IField NocoBase: interface yang harus diimplementasikan oleh field, mendefinisikan properti dan method field."
keywords: "IField,interface,field,Field,NocoBase"
---

# IField

`IField` mendefinisikan interface yang harus diimplementasikan oleh field.

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

