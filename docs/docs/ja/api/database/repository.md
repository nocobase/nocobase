:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# リポジトリ

## 概要

特定の`コレクション`オブジェクトから、その`リポジトリ`オブジェクトを取得して、データテーブルの読み書き操作を実行できます。

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### クエリ

#### 基本的なクエリ

`リポジトリ`オブジェクトでは、`find*`系のメソッドを呼び出すことでクエリ操作を実行できます。これらのクエリメソッドはすべて`filter`パラメーターの指定に対応しており、データのフィルタリングに利用できます。

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### オペレーター

`リポジトリ`の`filter`パラメーターでは、さまざまなオペレーターも提供されており、より多様なクエリ操作を実行できます。

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

オペレーターの詳細については、[フィルターオペレーター](/api/database/operators)を参照してください。

#### フィールドの制御

クエリ操作時には、`fields`、`except`、`appends`パラメーターを使用して出力フィールドを制御できます。

- `fields`: 出力フィールドを指定します。
- `except`: 出力フィールドから除外します。
- `appends`: 関連フィールドを出力に追加します。

```javascript
// 結果にはidとnameフィールドのみが含まれます。
userRepository.find({
  fields: ['id', 'name'],
});

// 結果にはpasswordフィールドは含まれません。
userRepository.find({
  except: ['password'],
});

// 結果には関連オブジェクトであるpostsのデータが含まれます。
userRepository.find({
  appends: ['posts'],
});
```

#### 関連フィールドのクエリ

`filter`パラメーターは関連フィールドによるフィルタリングに対応しています。例：

```javascript
// 関連するpostsに'post title'というタイトルのオブジェクトが存在するuserオブジェクトをクエリします。
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

関連フィールドはネストすることもできます。

```javascript
// そのpostsのcommentsに`keywords`が含まれるという条件を満たすuserオブジェクトをクエリします。
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### ソート

`sort`パラメーターを使用すると、クエリ結果をソートできます。

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

関連オブジェクトのフィールドでソートすることもできます。

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### 作成

#### 基本的な作成

`リポジトリ`を通じて新しいデータオブジェクトを作成します。

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// 一括作成にも対応しています。
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### 関連の作成

作成時に関連オブジェクトを同時に作成できます。クエリと同様に、関連オブジェクトのネストもサポートされています。例：

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// ユーザーを作成すると同時に、postをユーザーに関連付け、tagsをpostに関連付けます。
```

関連オブジェクトがすでにデータベースに存在する場合、そのIDを渡すことで、作成時に既存の関連オブジェクトとの関連付けを確立できます。

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // 既存の関連オブジェクトとの関連付けを確立します。
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### 更新

#### 基本的な更新

データオブジェクトを取得した後、そのデータオブジェクト（`Model`）のプロパティを直接変更し、`save`メソッドを呼び出して変更を保存できます。

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

データオブジェクトである`Model`はSequelize Modelを継承しています。`Model`の操作については、[Sequelize Model](https://sequelize.org/master/manual/model-basics.html)を参照してください。

`リポジトリ`を通じてデータを更新することもできます。

```javascript
// フィルタリング条件を満たすデータレコードを更新します。
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

更新時には、`whitelist`や`blacklist`パラメーターを使用して更新フィールドを制御できます。例：

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // ageフィールドのみを更新します。
});
```

#### 関連フィールドの更新

更新時に、関連オブジェクトを設定できます。例：

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // tag1との関連付けを確立します。
      },
      {
        name: 'tag2', // 新しいtagを作成し、関連付けを確立します。
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // postとtagsの関連付けを解除します。
  },
});
```

### 削除

`リポジトリ`の`destroy()`メソッドを呼び出すことで削除操作を実行できます。削除時にはフィルタリング条件を指定する必要があります。

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## コンストラクター

通常、開発者が直接呼び出すことはありません。主に`db.registerRepositories()`でタイプを登録した後、`db.collection()`のパラメーターで、対応する登録済みのリポジトリタイプを指定し、インスタンス化を完了します。

**シグネチャ**

- `constructor(collection: Collection)`

**例**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // ここで登録済みのリポジトリにリンクします
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## インスタンスメンバー

### `database`

コンテキストが属するデータベース管理インスタンスです。

### `collection`

対応するコレクション管理インスタンスです。

### `model`

対応するモデルクラスです。

## インスタンスメソッド

### `find()`

データベースからデータセットをクエリします。フィルタリング条件やソートなどを指定できます。

**シグネチャ**

- `async find(options?: FindOptions): Promise<Model[]>`

**タイプ**

```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**詳細**

#### `filter: Filter`

クエリ条件。データ結果のフィルタリングに使用されます。渡されるクエリパラメーターでは、`key`はクエリ対象のフィールド名であり、`value`にはクエリする値を渡すことができます。また、オペレーターと組み合わせて他の条件でデータをフィルタリングすることも可能です。

```typescript
// nameが'foo'で、ageが18より大きいレコードをクエリします。
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

その他のオペレーターについては、[クエリオペレーター](./operators.md)を参照してください。

#### `filterByTk: TargetKey`

`TargetKey`でデータをクエリします。これは`filter`パラメーターの便利な方法です。`TargetKey`がどのフィールドであるかは、`コレクション`で[設定](./collection.md#filtertargetkey)でき、デフォルトは`primaryKey`です。

```typescript
// デフォルトでは、idが1のレコードを検索します。
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

クエリ列。データフィールドの結果を制御するために使用されます。このパラメーターを渡すと、指定されたフィールドのみが返されます。

#### `except: string[]`

除外列。データフィールドの結果を制御するために使用されます。このパラメーターを渡すと、渡されたフィールドは出力されません。

#### `appends: string[]`

追加列。関連データをロードするために使用されます。このパラメーターを渡すと、指定された関連フィールドも出力されます。

#### `sort: string[] | string`

クエリ結果のソート方法を指定します。パラメーターはフィールド名です。デフォルトでは昇順（`asc`）でソートされます。降順（`desc`）でソートする必要がある場合は、フィールド名の前に`-`記号を追加します。例：`['-id', 'name']`は、`id desc, name asc`でソートすることを意味します。

#### `limit: number`

結果の数を制限します。`SQL`の`limit`と同じです。

#### `offset: number`

クエリのオフセット。`SQL`の`offset`と同じです。

**例**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

データベースから特定の条件を満たす単一のデータをクエリします。Sequelizeの`Model.findOne()`に相当します。

**シグネチャ**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**例**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

データベースから特定の条件を満たすデータの総数をクエリします。Sequelizeの`Model.count()`に相当します。

**シグネチャ**

- `count(options?: CountOptions): Promise<number>`

**タイプ**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**例**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

データベースから特定の条件を満たすデータセットと結果の総数をクエリします。Sequelizeの`Model.findAndCountAll()`に相当します。

**シグネチャ**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**タイプ**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**詳細**

クエリパラメーターは`find()`と同じです。戻り値は配列で、最初の要素はクエリ結果、2番目の要素は結果の総数です。

### `create()`

データテーブルに新しく作成されたデータを挿入します。Sequelizeの`Model.create()`に相当します。作成するデータオブジェクトが関連フィールドの情報を持つ場合、対応する関連データレコードも同時に作成または更新されます。

**シグネチャ**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**例**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // 関連テーブルの主キー値が存在する場合は、そのデータを更新します。
      { id: 1 },
      // 主キー値がない場合は、新しいデータを作成します。
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

データテーブルに複数の新しいデータを挿入します。`create()`メソッドを複数回呼び出すことに相当します。

**シグネチャ**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**タイプ**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**詳細**

- `records`: 作成するレコードのデータオブジェクトの配列です。
- `transaction`: トランザクションオブジェクト。トランザクションパラメーターが渡されない場合、このメソッドは自動的に内部トランザクションを作成します。

**例**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // 関連テーブルの主キー値が存在する場合は、そのデータを更新します。
        { id: 1 },
        // 主キー値がない場合は、新しいデータを作成します。
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 发布日志',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

データテーブル内のデータを更新します。Sequelizeの`Model.update()`に相当します。更新するデータオブジェクトが関連フィールドの情報を持つ場合、対応する関連データレコードも同時に作成または更新されます。

**シグネチャ**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**例**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // 関連テーブルの主キー値が存在する場合は、そのデータを更新します。
      { id: 1 },
      // 主キー値がない場合は、新しいデータを作成します。
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

データテーブルからデータを削除します。Sequelizeの`Model.destroy()`に相当します。

**シグネチャ**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**タイプ**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**詳細**

- `filter`: 削除するレコードのフィルタリング条件を指定します。`Filter`の詳細な使用法については、[`find()`](#find)メソッドを参照してください。
- `filterByTk`: `TargetKey`で削除するレコードのフィルタリング条件を指定します。
- `truncate`: テーブルデータをクリアするかどうか。`filter`または`filterByTk`パラメーターが渡されない場合に有効です。
- `transaction`: トランザクションオブジェクト。トランザクションパラメーターが渡されない場合、このメソッドは自動的に内部トランザクションを作成します。