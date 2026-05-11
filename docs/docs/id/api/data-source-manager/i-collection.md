---
title: "ICollection"
description: "Interface ICollection NocoBase: interface model data, mencakup repository, getFields, setField, dll."
keywords: "ICollection,interface,model data,Collection,NocoBase"
---

# ICollection

`ICollection` adalah interface dari model data, yang mencakup informasi seperti nama model, field, asosiasi, dll.

```typescript
export interface ICollection {
  repository: IRepository;

  updateOptions(options: any): void;

  setField(name: string, options: any): IField;

  removeField(name: string): void;

  getFields(): Array<IField>;

  getField(name: string): IField;

  [key: string]: any;
}
```

## Anggota

### repository

Instance `Repository` yang dimiliki oleh `ICollection`

## API

### updateOptions()

Memperbarui properti `Collection`

#### Signature

- `updateOptions(options: any): void`

### setField()

Mengatur field `Collection`

#### Signature

- `setField(name: string, options: any): IField`

### removeField()

Menghapus field `Collection`

#### Signature

- `removeField(name: string): void`

### getFields()

Mengambil semua field `Collection`

#### Signature

- `getFields(): Array<IField>`

### getField()

Mengambil field `Collection` berdasarkan nama

#### Signature

- `getField(name: string): IField`
