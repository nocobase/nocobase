:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# Auth

## 概要

`Auth` は、ユーザー認証タイプのための抽象クラスです。ユーザー認証を完了するために必要なインターフェースを定義しており、新しいユーザー認証タイプを拡張するには、`Auth` クラスを継承してそのメソッドを実装する必要があります。基本的な実装については、[BaseAuth](./base-auth.md) をご参照ください。

```ts
interface IAuth {
  user: Model;
  // Check the authenticaiton status and return the current user.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check: authentication
  async check() {
    // ...
  }
}
```

## インスタンスプロパティ

### `user`

認証されたユーザー情報です。

#### シグネチャ

- `abstract user: Model`

## クラスメソッド

### `constructor()`

コンストラクターです。`Auth` インスタンスを作成します。

#### シグネチャ

- `constructor(config: AuthConfig)`

#### 型

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### 詳細

##### AuthConfig

| プロパティ        | 型                                            | 説明                                                                                                   |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | オーセンティケーターのデータモデルです。NocoBase アプリケーションにおける実際の型は [AuthModel](/auth-verification/auth/dev/api#authmodel) です。 |
| `options`       | `Record<string, any>`                           | オーセンティケーター関連の設定です。                                                                           |
| `ctx`           | `Context`                                       | リクエストコンテキストです。                                                                                     |

### `check()`

ユーザー認証を行い、ユーザー情報を返します。すべての認証タイプで実装が必須となる抽象メソッドです。

#### シグネチャ

- `abstract check(): Promise<Model>`

### `signIn()`

ユーザーログインを行います。

#### シグネチャ

- `signIn(): Promise<any>`

### `signUp()`

ユーザー登録を行います。

#### シグネチャ

- `signUp(): Promise<any>`

### `signOut()`

ユーザーのログアウトを行います。

#### シグネチャ

- `signOut(): Promise<any>`