---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# 認証：CAS

## はじめに

Auth: CAS プラグインは、CAS (Central Authentication Service) プロトコル標準に準拠しており、ユーザーがサードパーティのID認証サービスプロバイダー (IdP) から提供されたアカウントを使ってNocoBaseにログインできるようにします。

## インストール

## 利用ガイド

### プラグインを有効化する

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### CAS認証を追加する

ユーザー認証管理ページにアクセスします。

http://localhost:13000/admin/settings/auth/authenticators

CAS認証方法を追加します。

![](https://static-docs.nocobase.com/268500c5008d3b90e57ff1e2ea41aca.png)

CASを設定して有効化します。

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### ログインページにアクセスする

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)