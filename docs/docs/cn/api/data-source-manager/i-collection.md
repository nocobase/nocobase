# ICollection

`ICollection` 是数据模型的接口，其中包含了模型的名称、字段、关联等信息。

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

## 成员

### repository

`ICollection` 所属的 `Repository` 实例

## API

### updateOptions()

更新 `Collection` 的属性

#### 签名

- `updateOptions(options: any): void`

### setField()

设置 `Collection` 的字段

#### 签名

- `setField(name: string, options: any): IField`

### removeField()

移除 `Collection` 的字段

#### 签名

- `removeField(name: string): void`

### getFields()

获取 `Collection` 的所有字段

#### 签名

- `getFields(): Array<IField>`

### getField()

根据名称获取 `Collection` 的字段

#### 签名

- `getField(name: string): IField`
