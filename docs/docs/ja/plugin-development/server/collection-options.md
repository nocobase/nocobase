:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

## コレクション設定パラメーター

```ts
export type MigrationRule =
  | 'overwrite'
  | 'skip'
  | 'upsert'
  | 'schema-only'
  | 'insert-ignore';

export interface CollectionOptions {
  name: string;
  title?: string;
  migrationRules?: MigrationRule[];
  inherits?: string[] | string;
  filterTargetKey?: string | string[];
  fields?: FieldOptions[];
  model?: string | ModelStatic<Model>;
  repository?: string | RepositoryType;
  autoGenId?: boolean;
  timestamps?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  deletedAt?: boolean;
  paranoid?: boolean;
  underscored?: boolean;
  indexes?: ModelIndexesOptions[];
}
```

### `name` - コレクション名
- **タイプ**: `string`
- **必須**: ✅
- **説明**: コレクションの一意の識別子です。アプリケーション全体で一意である必要があります。
- **例**:
```typescript
{
  name: 'users'  // ユーザー コレクション
}
```

### `title` - コレクションのタイトル
- **タイプ**: `string`
- **必須**: ❌
- **説明**: コレクションの表示タイトルで、フロントエンドのインターフェース表示に使用されます。
- **例**:
```typescript
{
  name: 'users',
  title: 'ユーザー管理'  // インターフェースでは「ユーザー管理」と表示されます
}
```

### `migrationRules` - マイグレーションルール
- **タイプ**: `MigrationRule[]`
- **必須**: ❌
- **説明**: データマイグレーション時の処理ルールです。
- **例**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // 既存のデータを上書きします
  fields: [...]
}
```

### `inherits` - コレクションの継承
- **タイプ**: `string[] | string`
- **必須**: ❌
- **説明**: 他のコレクションのフィールド定義を継承します。単一または複数のコレクションの継承をサポートしています。
- **例**:

```typescript
// 単一継承
{
  name: 'admin_users',
  inherits: 'users',  // `users` コレクションのすべてのフィールドを継承します
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// 複数継承
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // 複数のコレクションから継承します
  fields: [...]
}
```

### `filterTargetKey` - フィルターターゲットキー
- **タイプ**: `string | string[]`
- **必須**: ❌
- **説明**: クエリのフィルタリングに使用されるターゲットキーです。単一または複数のキーをサポートしています。
- **例**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // ユーザーIDでフィルタリング
  fields: [...]
}

// 複数のフィルターキー
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // ユーザーIDとカテゴリIDでフィルタリング
  fields: [...]
}
```

### `fields` - フィールド定義
- **タイプ**: `FieldOptions[]`
- **必須**: ❌
- **デフォルト値**: `[]`
- **説明**: コレクションのフィールド定義の配列です。各フィールドには、タイプ、名前、設定などの情報が含まれます。
- **例**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'ユーザー名'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'メールアドレス'
    },
    {
      type: 'password',
      name: 'password',
      title: 'パスワード'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: '作成日時'
    }
  ]
}
```

### `model` - カスタムモデル
- **タイプ**: `string | ModelStatic<Model>`
- **必須**: ❌
- **説明**: カスタムの Sequelize モデルクラスを指定します。クラス名またはモデルクラス自体を指定できます。
- **例**:
```typescript
// 文字列でモデルクラス名を指定
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// モデルクラスを使用
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - カスタムリポジトリ
- **タイプ**: `string | RepositoryType`
- **必須**: ❌
- **説明**: カスタムのリポジトリクラスを指定し、データアクセスロジックの処理に使用します。
- **例**:
```typescript
// 文字列でリポジトリクラス名を指定
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// リポジトリクラスを使用
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - IDの自動生成
- **タイプ**: `boolean`
- **必須**: ❌
- **デフォルト値**: `true`
- **説明**: 主キーIDを自動生成するかどうかを指定します。
- **例**:
```typescript
{
  name: 'users',
  autoGenId: true,  // 主キーIDを自動生成
  fields: [...]
}

// IDの自動生成を無効にする（主キーを手動で指定する必要があります）
{
  name: 'external_data',
  autoGenId: false,
fields: [
  {
    type: 'string',
      name: 'id',
      primaryKey: true
    }
  ]
}
```

### `timestamps` - タイムスタンプの有効化
- **タイプ**: `boolean`
- **必須**: ❌
- **デフォルト値**: `true`
- **説明**: 作成日時と更新日時フィールドを有効にするかどうかを指定します。
- **例**:
```typescript
{
  name: 'users',
  timestamps: true,  // タイムスタンプを有効にする
  fields: [...]
}
```

### `createdAt` - 作成日時フィールド
- **タイプ**: `boolean | string`
- **必須**: ❌
- **デフォルト値**: `true`
- **説明**: 作成日時フィールドの設定です。
- **例**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // 作成日時フィールド名をカスタム設定
  fields: [...]
}
```

### `updatedAt` - 更新日時フィールド
- **タイプ**: `boolean | string`
- **必須**: ❌
- **デフォルト値**: `true`
- **説明**: 更新日時フィールドの設定です。
- **例**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // 更新日時フィールド名をカスタム設定
  fields: [...]
}
```

### `deletedAt` - ソフトデリートフィールド
- **タイプ**: `boolean | string`
- **必須**: ❌
- **デフォルト値**: `false`
- **説明**: ソフトデリートフィールドの設定です。
- **例**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // ソフトデリートを有効にする
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - ソフトデリートモード
- **タイプ**: `boolean`
- **必須**: ❌
- **デフォルト値**: `false`
- **説明**: ソフトデリートモードを有効にするかどうかを指定します。
- **例**:
```typescript
{
  name: 'users',
  paranoid: true,  // ソフトデリートを有効にする
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - アンダースコア命名
- **タイプ**: `boolean`
- **必須**: ❌
- **デフォルト値**: `false`
- **説明**: アンダースコア命名スタイルを使用するかどうかを指定します。
- **例**:
```typescript
{
  name: 'users',
  underscored: true,  // アンダースコア命名スタイルを使用
  fields: [...]
}
```

### `indexes` - インデックス設定
- **タイプ**: `ModelIndexesOptions[]`
- **必須**: ❌
- **説明**: データベースのインデックス設定です。
- **例**:
```typescript
{
  name: 'users',
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['username', 'status']
    }
  ],
  fields: [...]
}
```

## フィールドパラメーター設定について

NocoBase は複数のフィールドタイプをサポートしており、すべてのフィールドは `FieldOptions` ユニオンタイプに基づいて定義されています。フィールド設定には、基本プロパティ、データタイプ固有のプロパティ、リレーションシッププロパティ、およびフロントエンドのレンダリングプロパティが含まれます。

### 基本フィールドオプション

すべてのフィールドタイプは `BaseFieldOptions` を継承しており、共通のフィールド設定機能を提供します。

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // 共通パラメーター
  name?: string;                    // フィールド名
  hidden?: boolean;                 // 非表示にするかどうか
  validation?: ValidationOptions<T>; // バリデーションルール

  // 一般的なカラムフィールドプロパティ
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // フロントエンド関連
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**例**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // NULL値を許可しない
  unique: true,           // 一意制約
  defaultValue: '',       // デフォルトは空文字列
  index: true,            // インデックスを作成
  comment: 'ユーザーログイン名'    // データベースコメント
}
```

### `name` - フィールド名

- **タイプ**: `string`
- **必須**: ❌
- **説明**: データベース内のフィールドのカラム名です。コレクション内で一意である必要があります。
- **例**:
```typescript
{
  type: 'string',
  name: 'username',  // フィールド名
  title: 'ユーザー名'
}
```

### `hidden` - 非表示フィールド

- **タイプ**: `boolean`
- **デフォルト値**: `false`
- **説明**: リスト/フォームでこのフィールドをデフォルトで非表示にするかどうかを指定します。
- **例**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // 内部IDフィールドを非表示にする
  title: '内部ID'
}
```

### `validation` - バリデーションルール

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // バリデーションタイプ
  rules: FieldValidationRule<T>[];  // バリデーションルールの配列
  [key: string]: any;              // その他のバリデーションオプション
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // ルールキー名
  name: FieldValidationRuleName<T>; // ルール名
  args?: {                         // ルールパラメーター
    [key: string]: any;
  };
  paramsType?: 'object';           // パラメータータイプ
}
```

- **タイプ**: `ValidationOptions<T>`
- **説明**: Joi を使用してサーバーサイドのバリデーションルールを定義します。
- **例**:
```typescript
{
  type: 'string',
  name: 'email',
  validation: {
    type: 'string',
    rules: [
      { key: 'email', name: 'email' },
      { key: 'required', name: 'required' }
    ]
  }
}
```

### `allowNull` - NULL値を許可

- **タイプ**: `boolean`
- **デフォルト値**: `true`
- **説明**: データベースが `NULL` 値の書き込みを許可するかどうかを制御します。
- **例**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // NULL値を許可しない
  title: 'ユーザー名'
}
```

### `defaultValue` - デフォルト値

- **タイプ**: `any`
- **説明**: フィールドのデフォルト値です。レコード作成時にそのフィールドの値が提供されなかった場合に使用されます。
- **例**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // デフォルトは下書きステータス
  title: 'ステータス'
}
```

### `unique` - 一意制約

- **タイプ**: `boolean | string`
- **デフォルト値**: `false`
- **説明**: 値が一意である必要があるかどうかです。文字列で制約名を指定できます。
- **例**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // メールアドレスは一意である必要があります
  title: 'メールアドレス'
}
```

### `primaryKey` - 主キー

- **タイプ**: `boolean`
- **デフォルト値**: `false`
- **説明**: このフィールドを主キーとして宣言します。
- **例**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // 主キーとして設定
  autoIncrement: true
}
```

### `autoIncrement` - 自動インクリメント

- **タイプ**: `boolean`
- **デフォルト値**: `false`
- **説明**: 自動インクリメントを有効にします（数値型フィールドにのみ適用されます）。
- **例**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // 自動インクリメント
  primaryKey: true
}
```

### `field` - データベースカラム名

- **タイプ**: `string`
- **説明**: 実際のデータベースカラム名を指定します（Sequelize の `field` と同じです）。
- **例**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // データベース内のカラム名
  title: 'ユーザーID'
}
```

### `comment` - データベースコメント

- **タイプ**: `string`
- **説明**: データベースフィールドのコメントで、ドキュメントの説明に使用されます。
- **例**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'システムログインに使用されるユーザーログイン名',  // データベースコメント
  title: 'ユーザー名'
}
```

### `title` - 表示タイトル

- **タイプ**: `string`
- **説明**: フィールドの表示タイトルで、通常、フロントエンドのインターフェース表示に使用されます。
- **例**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'ユーザー名',  // フロントエンドに表示されるタイトル
  allowNull: false
}
```

### `description` - フィールドの説明

- **タイプ**: `string`
- **説明**: フィールドに関する説明情報で、ユーザーがフィールドの用途を理解するのに役立ちます。
- **例**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'メールアドレス',
  description: '有効なメールアドレスを入力してください',  // フィールドの説明
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - インターフェースコンポーネント

- **タイプ**: `string`
- **説明**: 推奨されるフロントエンドのフィールドインターフェースコンポーネントです。
- **例**:
```typescript
{
  type: 'string',
  name: 'content',
  title: '内容',
  interface: 'textarea',  // テキストエリアコンポーネントの使用を推奨
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### フィールドタイプインターフェース

### `type: 'string'` - 文字列フィールド

- **説明**: 短いテキストデータを保存するために使用されます。長さ制限と自動トリムをサポートしています。
- **データベースタイプ**: `VARCHAR`
- **固有のプロパティ**:
  - `length`: 文字列の長さ制限
  - `trim`: 先頭と末尾の空白を自動的に削除するかどうか

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // 文字列の長さ制限
  trim?: boolean;     // 先頭と末尾の空白を自動的に削除するかどうか
}
```

**例**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'ユーザー名',
  length: 50,           // 最大50文字
  trim: true,           // 空白を自動的に削除
    allowNull: false,
    unique: true,
    validation: {
      type: 'string',
      rules: [
        { key: 'min', name: 'min', args: { limit: 3 } },
      { key: 'max', name: 'max', args: { limit: 20 } }
    ]
  }
}
```

### `type: 'text'` - テキストフィールド

- **説明**: 長いテキストデータを保存するために使用されます。MySQL の異なる長さのテキストタイプをサポートしています。
- **データベースタイプ**: `TEXT`、`MEDIUMTEXT`、`LONGTEXT`
- **固有のプロパティ**:
  - `length`: MySQL のテキスト長タイプ（tiny/medium/long）

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // MySQL のテキスト長タイプ
}
```

**例**:
```typescript
{
  type: 'text',
  name: 'content',
  title: '内容',
  length: 'medium',     // MEDIUMTEXT を使用
  allowNull: true
}
```

### 数値タイプ

### `type: 'integer'` - 整数フィールド

- **説明**: 整数データを保存するために使用されます。自動インクリメントと主キーをサポートしています。
- **データベースタイプ**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Sequelize の INTEGER タイプからすべてのオプションを継承
}
```

**例**:
```typescript
  {
    type: 'integer',
  name: 'id',
  title: 'ID',
  primaryKey: true,
  autoIncrement: true,
  allowNull: false
}
```

### `type: 'bigInt'` - BigInt フィールド

- **説明**: 大きな整数データを保存するために使用されます。`integer` よりも広い範囲を扱えます。
- **データベースタイプ**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**例**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'ユーザーID',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - 浮動小数点フィールド

- **説明**: 単精度浮動小数点数を保存するために使用されます。
- **データベースタイプ**: `FLOAT`
- **固有のプロパティ**:
  - `precision`: 精度（総桁数）
  - `scale`: 小数点以下の桁数

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // 精度
  scale?: number;      // 小数点以下の桁数
}
```

**例**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'スコア',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - 倍精度浮動小数点フィールド

- **説明**: 倍精度浮動小数点数を保存するために使用されます。`float` よりも高い精度を持ちます。
- **データベースタイプ**: `DOUBLE`
- **固有のプロパティ**:
  - `precision`: 精度（総桁数）
  - `scale`: 小数点以下の桁数

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**例**:
```typescript
{
  type: 'double',
    name: 'price',
      title: '価格',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - 実数フィールド

- **説明**: 実数を保存するために使用されます。データベースに依存します。
- **データベースタイプ**: `REAL`
- **固有のプロパティ**:
  - `precision`: 精度（総桁数）
  - `scale`: 小数点以下の桁数

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**例**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: '為替レート',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Decimal フィールド

- **説明**: 正確な小数を保存するために使用され、金融計算に適しています。
- **データベースタイプ**: `DECIMAL`
- **固有のプロパティ**:
  - `precision`: 精度（総桁数）
  - `scale`: 小数点以下の桁数

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // 精度（総桁数）
  scale?: number;      // 小数点以下の桁数
}
```

**例**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: '金額',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00,
  validation: {
    type: 'number',
    rules: [
      { key: 'min', name: 'min', args: { limit: 0 } }
    ]
  }
}
```

### ブールタイプ

### `type: 'boolean'` - ブールフィールド

- **説明**: 真偽値を保存するために使用され、通常、オン/オフの状態に使用されます。
- **データベースタイプ**: `BOOLEAN` または `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**例**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'アクティブかどうか',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - ラジオフィールド

- **説明**: 単一選択値を保存するために使用され、通常、二者択一の状況で使用されます。
- **データベースタイプ**: `BOOLEAN` または `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**例**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'デフォルトかどうか',
  defaultValue: false,
  allowNull: false
}
```

### 日時タイプ

### `type: 'date'` - 日付フィールド

- **説明**: 日付データを保存するために使用され、時間情報は含まれません。
- **データベースタイプ**: `DATE`
- **固有のプロパティ**:
  - `timezone`: タイムゾーン情報を含むかどうか

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // タイムゾーン情報を含むかどうか
}
```

**例**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: '誕生日',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - 時間フィールド

- **説明**: 時間データを保存するために使用され、日付情報は含まれません。
- **データベースタイプ**: `TIME`
- **固有のプロパティ**:
  - `timezone`: タイムゾーン情報を含むかどうか

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**例**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: '開始時間',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - タイムゾーン付き日時フィールド

- **説明**: タイムゾーン情報を含む日時データを保存するために使用されます。
- **データベースタイプ**: `TIMESTAMP WITH TIME ZONE`
- **固有のプロパティ**:
  - `timezone`: タイムゾーン情報を含むかどうか

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**例**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: '作成日時',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - タイムゾーンなし日時フィールド

- **説明**: タイムゾーン情報を含まない日時データを保存するために使用されます。
- **データベースタイプ**: `TIMESTAMP` または `DATETIME`
- **固有のプロパティ**:
  - `timezone`: タイムゾーン情報を含むかどうか

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**例**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: '更新日時',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - 日付のみフィールド

- **説明**: 日付のみのデータを保存するために使用され、時間情報は含まれません。
- **データベースタイプ**: `DATE`
- **例**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: '公開日',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Unix タイムスタンプフィールド

- **説明**: Unix タイムスタンプデータを保存するために使用されます。
- **データベースタイプ**: `BIGINT`
- **固有のプロパティ**:
  - `epoch`: エポック時間

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // エポック時間
}
```

**例**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: '最終ログイン日時',
  allowNull: true,
  epoch: 0
}
```

### JSON タイプ

### `type: 'json'` - JSON フィールド

- **説明**: JSON 形式のデータを保存するために使用され、複雑なデータ構造をサポートしています。
- **データベースタイプ**: `JSON` または `TEXT`
- **例**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'メタデータ',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - JSONB フィールド

- **説明**: JSONB 形式のデータを保存するために使用され（PostgreSQL 固有）、インデックスとクエリをサポートしています。
- **データベースタイプ**: `JSONB`（PostgreSQL）
- **例**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: '設定',
  allowNull: true,
  defaultValue: {}
}
```

### 配列タイプ

### `type: 'array'` - 配列フィールド

- **説明**: 配列データを保存するために使用され、複数の要素タイプをサポートしています。
- **データベースタイプ**: `JSON` または `ARRAY`
- **固有のプロパティ**:
  - `dataType`: ストレージタイプ（json/array）
  - `elementType`: 要素タイプ（STRING/INTEGER/BOOLEAN/JSON）

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // ストレージタイプ
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // 要素タイプ
}
```

**例**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'タグ',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - セットフィールド

- **説明**: セットデータを保存するために使用され、配列に似ていますが、一意性制約があります。
- **データベースタイプ**: `JSON` または `ARRAY`
- **固有のプロパティ**:
  - `dataType`: ストレージタイプ（json/array）
  - `elementType`: 要素タイプ（STRING/INTEGER/BOOLEAN/JSON）

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**例**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'カテゴリ',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### 識別子タイプ

### `type: 'uuid'` - UUID フィールド

- **説明**: UUID 形式の一意の識別子を保存するために使用されます。
- **データベースタイプ**: `UUID` または `VARCHAR(36)`
- **固有のプロパティ**:
  - `autoFill`: 自動入力

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // 自動入力
}
```

**例**:
```typescript
{
  type: 'uuid',
  name: 'id',
  title: 'ID',
  autoFill: true,
  allowNull: false,
  primaryKey: true
}
```

### `type: 'nanoid'` - Nanoid フィールド

- **説明**: Nanoid 形式の短い一意の識別子を保存するために使用されます。
- **データベースタイプ**: `VARCHAR`
- **固有のプロパティ**:
  - `size`: ID の長さ
  - `customAlphabet`: カスタム文字セット
  - `autoFill`: 自動入力

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // ID の長さ
  customAlphabet?: string;  // カスタム文字セット
  autoFill?: boolean;
}
```

**例**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'ショートID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - カスタム UID フィールド

- **説明**: カスタム形式の一意の識別子を保存するために使用されます。
- **データベースタイプ**: `VARCHAR`
- **固有のプロパティ**:
  - `prefix`: プレフィックス
  - `pattern`: バリデーションパターン

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // プレフィックス
  pattern?: string; // バリデーションパターン
}
```

**例**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'コード',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - Snowflake ID フィールド

- **説明**: Snowflake アルゴリズムによって生成された一意の識別子を保存するために使用されます。
- **データベースタイプ**: `BIGINT`
- **例**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'Snowflake ID',
  allowNull: false,
  unique: true
}
```

### 機能フィールド

### `type: 'password'` - パスワードフィールド

- **説明**: 暗号化されたパスワードデータを保存するために使用されます。
- **データベースタイプ**: `VARCHAR`
- **固有のプロパティ**:
  - `length`: ハッシュ長
  - `randomBytesSize`: ランダムバイトサイズ

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // ハッシュ長
  randomBytesSize?: number;  // ランダムバイトサイズ
}
```

**例**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'パスワード',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - 暗号化フィールド

- **説明**: 暗号化された機密データを保存するために使用されます。
- **データベースタイプ**: `VARCHAR`
- **例**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'シークレットキー',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - 仮想フィールド

- **説明**: 計算によって導き出される仮想データを保存するために使用され、データベースには保存されません。
- **データベースタイプ**: なし（仮想フィールド）
- **例**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'フルネーム'
}
```

### `type: 'context'` - コンテキストフィールド

- **説明**: 実行コンテキストからデータを読み取るために使用されます（現在のユーザー情報など）。
- **データベースタイプ**: `dataType` に基づいて決定されます。
- **固有のプロパティ**:
  - `dataIndex`: データインデックスパス
  - `dataType`: データタイプ
  - `createOnly`: 作成時のみ設定

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // データインデックスパス
  dataType?: string;   // データタイプ
  createOnly?: boolean; // 作成時のみ設定
}
```

**例**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: '現在のユーザーID',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### リレーションフィールド

### `type: 'belongsTo'` - Belongs To リレーションシップ

- **説明**: 多対一のリレーションシップを表し、現在のレコードが別のレコードに属することを示します。
- **データベースタイプ**: 外部キーフィールド
- **固有のプロパティ**:
  - `target`: ターゲットコレクション名
  - `foreignKey`: 外部キーフィールド名
  - `targetKey`: ターゲットコレクションのキーフィールド名
  - `onDelete`: 削除時のカスケード操作
  - `onUpdate`: 更新時のカスケード操作
  - `constraints`: 外部キー制約を有効にするかどうか

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // ターゲットコレクション名
  foreignKey?: string;  // 外部キーフィールド名
  targetKey?: string;   // ターゲットコレクションのキーフィールド名
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // 外部キー制約を有効にするかどうか
}
```

**例**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: '著者',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Has One リレーションシップ

- **説明**: 一対一のリレーションシップを表し、現在のレコードが関連レコードを1つ持つことを示します。
- **データベースタイプ**: 外部キーフィールド
- **固有のプロパティ**:
  - `target`: ターゲットコレクション名
  - `foreignKey`: 外部キーフィールド名
  - `sourceKey`: ソースコレクションのキーフィールド名
  - `onDelete`: 削除時のカスケード操作
  - `onUpdate`: 更新時のカスケード操作
  - `constraints`: 外部キー制約を有効にするかどうか

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // ソースコレクションのキーフィールド名
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**例**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'ユーザープロフィール',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Has Many リレーションシップ

- **説明**: 一対多のリレーションシップを表し、現在のレコードが複数の関連レコードを持つことを示します。
- **データベースタイプ**: 外部キーフィールド
- **固有のプロパティ**:
  - `target`: ターゲットコレクション名
  - `foreignKey`: 外部キーフィールド名
  - `sourceKey`: ソースコレクションのキーフィールド名
  - `sortBy`: ソートフィールド
  - `sortable`: ソート可能かどうか
  - `onDelete`: 削除時のカスケード操作
  - `onUpdate`: 更新時のカスケード操作
  - `constraints`: 外部キー制約を有効にするかどうか

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // ソートフィールド
  sortable?: boolean; // ソート可能かどうか
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**例**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: '記事リスト',
  target: 'articles',
  foreignKey: 'authorId',
  sourceKey: 'id',
    sortBy: ['createdAt'],
  sortable: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'belongsToMany'` - Belongs To Many リレーションシップ

- **説明**: 多対多のリレーションシップを表し、中間テーブルを介して2つのコレクションを接続します。
- **データベースタイプ**: 中間テーブル
- **固有のプロパティ**:
  - `target`: ターゲットコレクション名
  - `through`: 中間テーブル名
  - `foreignKey`: 外部キーフィールド名
  - `otherKey`: 中間テーブルのもう一方の外部キー
  - `sourceKey`: ソースコレクションのキーフィールド名
  - `targetKey`: ターゲットコレクションのキーフィールド名
  - `onDelete`: 削除時のカスケード操作
  - `onUpdate`: 更新時のカスケード操作
  - `constraints`: 外部キー制約を有効にするかどうか

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // 中間テーブル名
  foreignKey?: string;
  otherKey?: string;  // 中間テーブルのもう一方の外部キー
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**例**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'タグ',
  target: 'article_tags',
  through: 'article_tag_relations',
  foreignKey: 'articleId',
  otherKey: 'tagId',
  sourceKey: 'id',
  targetKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```