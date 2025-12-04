---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# 認証：SAML 2.0

## はじめに

認証：SAML 2.0 プラグインは、SAML 2.0 (Security Assertion Markup Language 2.0) プロトコル標準に準拠しており、ユーザーがサードパーティのIDプロバイダー (IdP) が提供するアカウントを使ってNocoBaseにログインできるようにします。

## プラグインを有効にする

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## SAML認証を追加する

ユーザー認証プラグイン管理ページに移動します。

![](https://static-docs.nocobase.com/202411130004459.png)

追加 - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## 設定

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- SSO URL - IdPが提供する、シングルサインオン (SSO) に使用されるURLです。
- 公開証明書 (Public Certificate) - IdPが提供します。
- エンティティID (IdP Issuer) - オプション。IdPが提供します。
- http - NocoBaseアプリケーションがHTTPプロトコルを使用している場合は、チェックを入れてください。
- ユーザー紐付けフィールド - 既存ユーザーとの紐付けに使用するフィールドです。メールアドレスまたはユーザー名を選択でき、デフォルトはメールアドレスです。IdPが提供するユーザー情報には、`email` または `username` フィールドが含まれている必要があります。
- ユーザーが存在しない場合に自動登録 - 紐付け可能な既存ユーザーが見つからない場合に、新しいユーザーを自動的に作成するかどうかを設定します。
- 利用方法 (Usage) - `SP Issuer / EntityID` と `ACS URL` は、IdPの対応する設定にコピーして入力するために使用します。

## フィールドマッピング

フィールドマッピングは、IdPの設定プラットフォームで設定する必要があります。[例](./examples/google.md) を参照してください。

NocoBaseでマッピング可能なフィールドは以下の通りです。

- email（必須）
- phone (scopeで `phone` をサポートするプラットフォームでのみ有効です。例：Alibaba Cloud、Feishuなど)
- nickname
- username
- firstName
- lastName

`nameID` はSAMLプロトコルによって運ばれるため、マッピングは不要で、ユーザーの一意の識別子として保存されます。
新規ユーザーのニックネームの優先順位は以下の通りです： `nickname` > `firstName lastName` > `username` > `nameID`
現在、ユーザーの組織やロールのマッピングはサポートされていません。

## ログイン

ログインページにアクセスし、ログインフォームの下にあるボタンをクリックしてサードパーティログインを開始します。

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)