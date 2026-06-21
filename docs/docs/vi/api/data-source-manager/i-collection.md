---
title: "ICollection"
description: "Interface ICollection của NocoBase: interface model dữ liệu, gồm repository, getFields, setField, v.v."
keywords: "ICollection,interface,model dữ liệu,Collection,NocoBase"
---

# ICollection

`ICollection` là interface của model dữ liệu, bao gồm thông tin về tên, field, quan hệ của model.

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

## Thành viên

### repository

Instance `Repository` của `ICollection`.

## API

### updateOptions()

Cập nhật thuộc tính của `Collection`.

#### Chữ ký

- `updateOptions(options: any): void`

### setField()

Đặt field cho `Collection`.

#### Chữ ký

- `setField(name: string, options: any): IField`

### removeField()

Xóa field của `Collection`.

#### Chữ ký

- `removeField(name: string): void`

### getFields()

Lấy tất cả field của `Collection`.

#### Chữ ký

- `getFields(): Array<IField>`

### getField()

Lấy field của `Collection` theo tên.

#### Chữ ký

- `getField(name: string): IField`
