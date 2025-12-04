:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# テスト

NocoBaseは、開発者がプラグイン開発中にデータベースのロジック、APIインターフェース、機能実装の正確性を素早く検証できるよう、包括的なテストツールを提供しています。このガイドでは、これらのテストの書き方、実行方法、整理方法についてご紹介します。

## なぜテストを書くのか

プラグイン開発において自動テストを書くことには、次のようなメリットがあります。

- データベースモデル、API、ビジネスロジックが正しいかを素早く検証できます。
- 回帰エラーを防ぎます（コアのアップグレード後にプラグインの互換性を自動で検出します）。
- 継続的インテグレーション（CI）環境でのテスト自動実行をサポートします。
- 完全なサービスを起動せずにプラグイン機能をテストできます。

## テスト環境の基本

NocoBaseは、主に2つのテストツールを提供しています。

| ツール | 説明 | 用途 |
|------|------|------|
| `createMockDatabase` | インメモリデータベースインスタンスを作成します | データベースモデルとロジックのテスト |
| `createMockServer` | データベース、プラグイン、APIなどを含む完全なアプリケーションインスタンスを作成します | ビジネスプロセスとインターフェースの動作のテスト |

## `createMockDatabase` を使ったデータベーステスト

`createMockDatabase` は、モデル定義、フィールドタイプ、リレーション、CRUDオペレーションなど、データベースに直接関連する機能のテストに適しています。

### 基本的な例

```ts
import { createMockDatabase, Database } from '@nocobase/database';

describe('Database test', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create and query data', async () => {
    const User = db.コレクション({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'integer', name: 'age' },
      ],
    });

    await User.sync();

    const user = await db.getRepository('users').create({
      values: { username: 'testuser', age: 25 },
    });

    const found = await db.getRepository('users').findOne({
      filter: { username: 'testuser' },
    });

    expect(found.get('age')).toBe(25);
  });
});
```

### CRUDオペレーションのテスト

```ts
const Posts = db.コレクション({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// 作成
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// 更新
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### モデル関連のテスト

```ts
const Users = db.コレクション({
  name: 'users',
  fields: [
    { type: 'string', name: 'username' },
    { type: 'hasMany', name: 'posts' },
  ],
});

const Posts = db.コレクション({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'belongsTo', name: 'author' },
  ],
});
await db.sync();

const user = await db.getRepository('users').create({ values: { username: 'tester' } });
await db.getRepository('posts').create({
  values: { title: 'Post 1', authorId: user.get('id') },
});

const result = await db.getRepository('users').findOne({
  filterByTk: user.get('id'),
  appends: ['posts'],
});
expect(result.get('posts')).toHaveLength(1);
```

## `createMockServer` を使ったAPIテスト

`createMockServer` は、データベース、プラグイン、APIルートを含む完全なアプリケーションインスタンスを自動的に作成するため、プラグインのインターフェースのテストに非常に適しています。

### 基本的な例

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('User API test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: ['users', 'auth'] });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create a user', async () => {
    const response = await app.agent()
      .post('/users:create')
      .send({ username: 'test', email: 'a@b.com', password: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('test');
  });
});
```

### APIのクエリと更新のテスト

```ts
// ユーザーリストのクエリ
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// ユーザーの更新
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### ログイン状態や権限のテストをシミュレートする

`MockServer` を作成する際に `auth` プラグインを有効にすると、ログインインターフェースを使ってトークンやセッションを取得できます。

```ts
const res = await app
  .agent()
  .post('/auth:signin')
  .send({ 
    username: 'admin',
    password: 'admin123',
  });

const token = res.body.data.token;

await app
  .agent()
  .set('Authorization', `Bearer ${token}`)
  .get('/protected-endpoint');
```

よりシンプルな `login()` メソッドも利用できます。

```ts
await app.agent().login(userOrId);
```

## プラグインでのテストファイルの整理

プラグインの `./src/server/__tests__` フォルダーに、サーバーサイドロジックに関連するテストファイルを格納することをお勧めします。

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # ソースコードディレクトリ
│   └── server/              # サーバーサイドコード
│       ├── __tests__/       # テストファイルディレクトリ
│       │   ├── db.test.ts   # データベース関連のテスト (createMockDatabaseを使用)
│       │   └── api.test.ts  # API関連のテスト
```

## テストの実行

```bash
# ディレクトリを指定
yarn test packages/plugins/@my-project/plugin-hello/src/server
# ファイルを指定
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```