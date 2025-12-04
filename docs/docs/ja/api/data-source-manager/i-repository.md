:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# IRepository

`Repository` インターフェースは、データソースのCRUD操作に対応するための一連のモデル操作メソッドを定義しています。

## API

### find()

クエリパラメータに基づいて、条件に合致するモデルのリストを返します。

#### シグネチャ

- `find(options?: any): Promise<IModel[]>`

### findOne()

クエリパラメータに基づいて、条件に合致するモデルを返します。複数のモデルが条件に合致する場合でも、最初のモデルのみを返します。

#### シグネチャ

- `findOne(options?: any): Promise<IModel>`

### count()

クエリパラメータに基づいて、条件に合致するモデルの数を返します。

#### シグネチャ

- `count(options?: any): Promise<Number>`

### findAndCount()

クエリパラメータに基づいて、条件に合致するモデルのリストと、その数を返します。

#### シグネチャ

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

モデルデータオブジェクトを作成します。

#### シグネチャ

- `create(options: any): void`

### update()

クエリ条件に基づいて、モデルデータオブジェクトを更新します。

#### シグネチャ

- `update(options: any): void`

### destroy()

クエリ条件に基づいて、モデルデータオブジェクトを削除します。

#### シグネチャ

- `destroy(options: any): void`