:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ICollection

`ICollection` はデータモデルのインターフェースで、モデル名、フィールド、関連などの情報を含んでいます。

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

## メンバー

### repository

`ICollection` が所属する `Repository` インスタンスです。

## API

### updateOptions()

`コレクション` のプロパティを更新します。

#### シグネチャ

- `updateOptions(options: any): void`

### setField()

`コレクション` のフィールドを設定します。

#### シグネチャ

- `setField(name: string, options: any): IField`

### removeField()

`コレクション` からフィールドを削除します。

#### シグネチャ

- `removeField(name: string): void`

### getFields()

`コレクション` のすべてのフィールドを取得します。

#### シグネチャ

- `getFields(): Array<IField>`

### getField()

名前を指定して、`コレクション` のフィールドを取得します。

#### シグネチャ

- `getField(name: string): IField`