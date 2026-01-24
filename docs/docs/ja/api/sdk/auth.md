:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# Auth

## 概要

`Auth` クラスは、主にクライアント側でユーザー情報にアクセスしたり、ユーザー認証関連のAPIをリクエストしたりするために利用されます。

## インスタンスプロパティ

### `locale`

現在のユーザーが使用している言語です。

### `role`

現在のユーザーが使用しているロールです。

### `token`

APIの`token`です。

### `authenticator`

現在のユーザー認証に使用されるオーセンティケーターです。[ユーザー認証](/auth-verification/auth/)をご参照ください。

## クラスメソッド

### `signIn()`

ユーザーのサインイン（ログイン）を行います。

#### シグネチャ

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### 詳細

| パラメータ名          | 型     | 説明                                     |
| --------------- | -------- | ---------------------------------------- |
| `values`        | `any`    | サインインAPIのリクエストパラメータです。     |
| `authenticator` | `string` | サインインに使用するオーセンティケーターの識別子です。 |

### `signUp()`

ユーザーのサインアップ（新規登録）を行います。

#### シグネチャ

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### 詳細

| パラメータ名          | 型     | 説明                                     |
| --------------- | -------- | ---------------------------------------- |
| `values`        | `any`    | サインアップAPIのリクエストパラメータです。     |
| `authenticator` | `string` | サインアップに使用するオーセンティケーターの識別子です。 |

### `signOut()`

サインアウト（ログアウト）を行います。

#### シグネチャ

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### 詳細

| パラメータ名          | 型     | 説明                                     |
| --------------- | -------- | ---------------------------------------- |
| `values`        | `any`    | サインアウトAPIのリクエストパラメータです。     |
| `authenticator` | `string` | サインアウトに使用するオーセンティケーターの識別子です。 |