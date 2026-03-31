:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 認証タイプの拡張

## 概要

NocoBaseでは、必要に応じてユーザー認証タイプを拡張できます。ユーザー認証には主に2つのタイプがあります。1つは、パスワードログインやSMSログインのように、NocoBaseアプリケーション内でユーザーの身元を判断するタイプです。もう1つは、OIDCやSAMLなどの認証方法のように、サードパーティサービスがユーザーの身元を判断し、その結果をコールバックを通じてNocoBaseアプリケーションに通知するタイプです。NocoBaseにおけるこれら2つの異なる認証タイプのプロセスは、基本的に以下のようになります。

### サードパーティのコールバックに依存しない場合

1. クライアントはNocoBase SDKを使用してログインインターフェース `api.auth.signIn()` を呼び出し、ログインインターフェース `auth:signIn` をリクエストします。この際、現在使用している認証器の識別子をリクエストヘッダー `X-Authenticator` を介してバックエンドに渡します。
2. `auth:signIn` インターフェースは、リクエストヘッダー内の認証器識別子に基づいて、認証器に対応する認証タイプに転送され、その認証タイプに登録されている認証クラスの `validate` メソッドが関連するロジック処理を実行します。
3. クライアントは `auth:signIn` インターフェースのレスポンスからユーザー情報と認証 `token` を取得し、`token` をLocal Storageに保存してログインを完了します。このステップはSDK内部で自動的に処理されます。

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### サードパーティのコールバックに依存する場合

1. クライアントは、自身で登録したインターフェース（例: `auth:getAuthUrl`）を通じてサードパーティのログインURLを取得し、プロトコルに従ってアプリケーション名や認証器の識別子などの情報を渡します。
2. サードパーティのURLにリダイレクトしてログインを完了します。サードパーティサービスはNocoBaseアプリケーションのコールバックインターフェース（自身で登録する必要があります。例: `auth:redirect`）を呼び出し、認証結果を返します。この際、アプリケーション名や認証器の識別子などの情報も返されます。
3. コールバックインターフェースメソッドは、パラメータを解析して認証器の識別子を取得し、`AuthManager` を介して対応する認証クラスを取得し、`auth.signIn()` メソッドを能動的に呼び出します。`auth.signIn()` メソッドは `validate()` メソッドを呼び出して認証ロジックを処理します。
4. コールバックメソッドは認証 `token` を取得した後、302リダイレクトでフロントエンドページに戻り、URLパラメータに `token` と認証器の識別子（例: `?authenticator=xxx&token=yyy`）を含めます。

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

次に、サーバーサイドインターフェースとクライアントサイドユーザーインターフェースの登録方法について説明します。

## サーバーサイド

### 認証インターフェース

NocoBaseのコアは、認証タイプの拡張に関する登録と管理機能を提供しています。ログインプラグインのコアロジックを拡張するには、コアの抽象クラス `Auth` を継承し、対応する標準インターフェースを実装する必要があります。  
完全なAPIリファレンスは [Auth](/api/auth/auth) を参照してください。

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

コアは、ユーザー認証に関連する基本的なリソース操作も登録しています。

| API            | 説明             |
| -------------- | ---------------- |
| `auth:check`   | ユーザーのログイン状態を確認 |
| `auth:signIn`  | ログイン             |
| `auth:signUp`  | 登録             |
| `auth:signOut` | ログアウト         |

ほとんどの場合、拡張されたユーザー認証タイプは、既存のJWT認証ロジックを流用して、APIにアクセスするためのユーザー認証情報を生成できます。コアの `BaseAuth` クラスは `Auth` 抽象クラスの基本的な実装を提供しています。詳細は [BaseAuth](../../../api/auth/base-auth.md) を参照してください。プラグインは `BaseAuth` クラスを直接継承することで、一部のロジックコードを再利用し、開発コストを削減できます。

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // ユーザーコレクションを設定
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // ユーザー認証ロジックを実装
  async validate() {}
}
```

### ユーザーデータ

ユーザー認証ロジックを実装する際、通常はユーザーデータの処理が伴います。NocoBaseアプリケーションでは、関連するテーブル（コレクション）はデフォルトで次のように定義されています。

| コレクション           | 役割                                               | プラグイン                                                           |
| --------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| `users`               | メールアドレス、ニックネーム、パスワードなどのユーザー情報を保存 | [ユーザープラグイン (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | 認証器（認証タイプエンティティ）情報、対応する認証タイプと設定を保存 | ユーザー認証プラグイン (`@nocobase/plugin-auth`)                         |
| `usersAuthenticators` | ユーザーと認証器を関連付け、対応する認証器の下にユーザー情報を保存     | ユーザー認証プラグイン (`@nocobase/plugin-auth`)                         |

通常、拡張されたログイン方法では、`users` と `usersAuthenticators` を使用して関連するユーザーデータを保存するだけで十分です。特別な場合にのみ、独自の新しいコレクションを追加する必要があります。

`usersAuthenticators` の主なフィールドは次のとおりです。

| フィールド            | 説明                                                 |
| --------------- | ---------------------------------------------------- |
| `uuid`          | この認証方法におけるユーザーの一意の識別子（例: 電話番号、WeChat OpenIDなど） |
| `meta`          | JSONフィールド、その他保存する必要がある情報                        |
| `userId`        | ユーザーID                                              |
| `authenticator` | 認証器名（一意の識別子）                               |

ユーザーのクエリおよび作成操作のために、`authenticators` のデータモデル `AuthModel` にはいくつかのメソッドがカプセル化されており、`CustomAuth` クラス内で `this.authenticator[メソッド名]` を介して使用できます。完全なAPIリファレンスは [AuthModel](./api#authmodel) を参照してください。

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // ユーザーを検索
    this.authenticator.newUser(); // 新しいユーザーを作成
    this.authenticator.findOrCreateUser(); // ユーザーを検索または作成
    // ...
  }
}
```

### 認証タイプの登録

拡張された認証方法は、認証管理モジュールに登録する必要があります。

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## クライアントサイド

クライアントサイドのユーザーインターフェースは、ユーザー認証プラグインのクライアントが提供するインターフェース `registerType` を介して登録されます。

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // ログインフォーム
        SignInButton, // ログイン（サードパーティ）ボタン。ログインフォームとどちらか一方を選択できます。
        SignUpForm, // 登録フォーム
        AdminSettingsForm, // 管理設定フォーム
      },
    });
  }
}
```

### ログインフォーム

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

複数の認証器に対応する認証タイプがログインフォームを登録している場合、それらはタブ形式で表示されます。タブのタイトルは、バックエンドで設定された認証器のタイトルになります。

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### ログインボタン

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

通常はサードパーティのログインボタンとして使用されますが、実際には任意のコンポーネントにすることができます。

### 登録フォーム

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

ログインページから登録ページへ遷移する必要がある場合は、ログインコンポーネント内でご自身で処理を行う必要があります。

### 管理設定フォーム

![](https://static-docs.nocobase.com/f4b544b5b0f4afee5621ad4abf66b24f.png)

上部には汎用的な認証器設定があり、下部には登録可能なカスタム設定フォームの部分が表示されます。

### APIリクエスト

クライアントサイドでユーザー認証関連のAPIリクエストを行うには、NocoBaseが提供するSDKを使用できます。

```ts
import { useAPIClient } from '@nocobase/client';

// コンポーネント内で使用
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

詳細なAPIリファレンスは [@nocobase/sdk - Auth](/api/sdk/auth) を参照してください。