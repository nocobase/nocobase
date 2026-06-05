:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# RelationRepository

`RelationRepository` は、関連タイプのための `Repository` オブジェクトです。`RelationRepository` を使うと、関連をロードすることなく、関連データに対して操作を実行できます。`RelationRepository` をベースとして、各関連タイプに対応する派生実装が用意されています。具体的には以下の通りです。

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## コンストラクター

**シグネチャ**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**パラメーター**

| パラメーター名     | 型                 | デフォルト値 | 説明                                                              |
| :----------------- | :----------------- | :----------- | :---------------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -            | 関連における参照関係（referencing relation）に対応する**コレクション** |
| `association`      | `string`           | -            | 関連名                                                            |
| `sourceKeyValue`   | `string \| number` | -            | 参照関係におけるキー値                                            |

## 基底クラスのプロパティ

### `db: Database`

データベースオブジェクト

### `sourceCollection`

関連における参照関係（referencing relation）に対応する**コレクション**

### `targetCollection`

関連における被参照関係（referenced relation）に対応する**コレクション**

### `association`

Sequelize における現在の関連に対応する association オブジェクト

### `associationField`

**コレクション**における現在の関連に対応するフィールド

### `sourceKeyValue`

参照関係におけるキー値