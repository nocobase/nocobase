:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# API リファレンス

## サーバーサイド

### Auth

コア API です。詳細は [Auth](/api/auth/auth) を参照してください。

### BaseAuth

コア API です。詳細は [BaseAuth](/api/auth/base-auth) を参照してください。

### AuthModel

#### 概要

`AuthModel` は NocoBase アプリケーションで利用される認証器 (`Authenticator`、詳細は [AuthManager - setStorer](/api/auth/auth-manager#setstorer) および [Auth - constructor](/api/auth/auth#constructor) を参照) のデータモデルです。ユーザーデータ コレクションとやり取りするためのいくつかのメソッドを提供します。これに加えて、Sequelize Model が提供するメソッドも利用できます。

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser();
    this.authenticator.newUser();
    this.authenticator.findOrCreateUser();
    // ...
  }
}
```

#### クラスメソッド

- `findUser(uuid: string): UserModel` - `uuid` を使ってユーザーを検索します。
  - `uuid` - 現在の認証タイプに紐づくユーザーの一意な識別子

- `newUser(uuid: string, userValues?: any): UserModel` - 新しいユーザーを作成し、`uuid` を使ってユーザーを現在の認証器に紐付けます。
  - `uuid` - 現在の認証タイプに紐づくユーザーの一意な識別子
  - `userValues` - オプション。その他のユーザー情報です。渡されない場合、`uuid` がユーザーのニックネームとして使用されます。

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - ユーザーを検索するか、新しいユーザーを作成します。作成ルールは上記と同じです。
  - `uuid` - 現在の認証タイプに紐づくユーザーの一意な識別子
  - `userValues` - オプション。その他のユーザー情報です。

## クライアントサイド

### `plugin.registerType()`

認証タイプのクライアントを登録します。

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm,
        // SignInButton
        SignUpForm,
        AdminSettingsForm,
      },
    });
  }
}
```

#### シグネチャ

- `registerType(authType: string, options: AuthOptions)`

#### 型

```ts
export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};
```

#### 詳細

- `SignInForm` - サインインフォーム
- `SignInButton` - サインイン（サードパーティ）ボタン。サインインフォームの代替として利用できます。
- `SignUpForm` - サインアップフォーム
- `AdminSettingsForm` - 管理者設定フォーム

### ルート

Auth プラグインが登録するフロントエンドのルートは以下の通りです。

- Auth レイアウト
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- サインインページ
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- サインアップページ
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`