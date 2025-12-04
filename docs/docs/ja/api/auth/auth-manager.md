:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# AuthManager

## 概要

`AuthManager` は NocoBase のユーザー認証管理モジュールで、様々なユーザー認証タイプを登録するために使用されます。

### 基本的な使い方

```ts
const authManager = new AuthManager({
  // リクエストヘッダーから現在の認証器識別子を取得するために使用されます
  authKey: 'X-Authenticator',
});

// AuthManager が認証器を保存・取得するためのメソッドを設定します
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// 認証タイプを登録します
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// 認証ミドルウェアを使用します
app.resourceManager.use(authManager.middleware());
```

### 概念

- **認証タイプ (`AuthType`)**: パスワード、SMS、OIDC、SAML など、様々なユーザー認証方法です。
- **認証器 (`Authenticator`)**: 認証方式の実体で、実際にデータテーブルに保存され、特定の認証タイプ (`AuthType`) の設定レコードに対応します。一つの認証方式で複数の認証器を持つことができ、それぞれが複数の設定に対応し、様々なユーザー認証方法を提供します。
- **認証器識別子 (`Authenticator name`)**: 認証器の一意な識別子で、現在のリクエストで使用される認証方式を特定するために使用されます。

## クラスメソッド

### `constructor()`

コンストラクタで、`AuthManager` のインスタンスを作成します。

#### シグネチャ

- `constructor(options: AuthManagerOptions)`

#### 型

```ts
export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};
```

#### 詳細

##### AuthManagerOptions

| プロパティ  | 型                          | 説明                                            | デフォルト値      |
| ----------- | --------------------------- | ----------------------------------------------- | ----------------- |
| `authKey`   | `string`                    | オプション。リクエストヘッダーで現在の認証器識別子を保持するキーです。 | `X-Authenticator` |
| `default`   | `string`                    | オプション。デフォルトの認証器識別子です。      | `basic`           |
| `jwt`       | [`JwtOptions`](#jwtoptions) | オプション。JWT を使用して認証を行う場合に設定できます。 | -                 |

##### JwtOptions

| プロパティ  | 型     | 説明               | デフォルト値      |
| ----------- | -------- | ------------------ | ----------------- |
| `secret`    | `string` | トークンの秘密鍵   | `X-Authenticator` |
| `expiresIn` | `string` | オプション。トークンの有効期限です。 | `7d`              |

### `setStorer()`

認証器データの保存および取得方法を設定します。

#### シグネチャ

- `setStorer(storer: Storer)`

#### 型

```ts
export interface Authenticator = {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
};

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}
```

#### 詳細

##### Authenticator

| プロパティ | 型                  | 説明               |
| ---------- | --------------------- | ------------------ |
| `authType` | `string`              | 認証タイプ         |
| `options`  | `Record<string, any>` | 認証器関連の設定   |

##### Storer

`Storer` は認証器のストレージインターフェースで、一つのメソッドを含みます。

- `get(name: string): Promise<Authenticator>` - 認証器識別子を使って認証器を取得します。NocoBase では、実際に返される型は [AuthModel](/auth-verification/auth/dev/api#authmodel) です。

### `registerTypes()`

認証タイプを登録します。

#### シグネチャ

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### 型

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
};
```

#### 詳細

| プロパティ | 型                 | 説明                                              |
| ---------- | ------------------ | ------------------------------------------------- |
| `auth`     | `AuthExtend<Auth>` | 認証タイプの実装です。[Auth](./auth) を参照してください。 |
| `title`    | `string`           | オプション。この認証タイプがフロントエンドで表示されるタイトルです。 |

### `listTypes()`

登録済みの認証タイプリストを取得します。

#### シグネチャ

- `listTypes(): { name: string; title: string }[]`

#### 詳細

| プロパティ | 型     | 説明             |
| ---------- | -------- | ---------------- |
| `name`     | `string` | 認証タイプ識別子 |
| `title`    | `string` | 認証タイプタイトル |

### `get()`

認証器を取得します。

#### シグネチャ

- `get(name: string, ctx: Context)`

#### 詳細

| プロパティ | 型      | 説明             |
| ---------- | --------- | ---------------- |
| `name`     | `string`  | 認証器識別子     |
| `ctx`      | `Context` | リクエストコンテキスト |

### `middleware()`

認証ミドルウェアです。現在の認証器を取得し、ユーザー認証を行います。