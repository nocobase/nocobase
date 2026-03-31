:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# BaseAuth

## 概要

`BaseAuth` は、[Auth](./auth) 抽象クラスを継承した、ユーザー認証タイプの基本的な実装です。JWT を認証方式として使用します。ほとんどの場合、ユーザー認証タイプを拡張する際は `BaseAuth` を継承して拡張できます。`Auth` 抽象クラスを直接継承する必要はありません。

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // ユーザーコレクションを設定
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // ユーザー認証ロジック。`auth.signIn` から呼び出されます。
  // ユーザーデータを返します
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## クラスメソッド

### `constructor()`

コンストラクターです。`BaseAuth` のインスタンスを作成します。

#### シグネチャ

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### 詳細

| パラメーター     | 型         | 説明                                                                                                |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | [Auth - AuthConfig](./auth#authconfig) を参照してください。                                         |
| `userCollection` | `コレクション` | ユーザーコレクションです。例: `db.getCollection('users')`。[DataBase - Collection](../database/collection) を参照してください。 |

### `user()`

アクセサーです。ユーザー情報を設定・取得します。デフォルトでは `ctx.state.currentUser` オブジェクトを使用してアクセスします。

#### シグネチャ

- `set user()`
- `get user()`

### `check()`

リクエストトークンを介して認証を行い、ユーザー情報を返します。

### `signIn()`

ユーザーのサインイン（ログイン）を行い、トークンを生成します。

### `signUp()`

ユーザーのサインアップ（登録）を行います。

### `signOut()`

ユーザーのサインアウト（ログアウト）を行い、トークンを期限切れにします。

### `validate()` \*

認証のコアロジックです。`signIn` インターフェースから呼び出され、ユーザーが正常にサインインできるかを判断します。