---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::



pkg: '@nocobase/plugin-auth-ldap'
---

# 認証：LDAP

## はじめに

認証：LDAP プラグインは、LDAP (Lightweight Directory Access Protocol) プロトコル標準に準拠しており、ユーザーがLDAPサーバーの認証情報（アカウントとパスワード）を使ってNocoBaseにログインできるようにします。

## プラグインを有効にする

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## LDAP認証の追加

ユーザー認証プラグインの管理ページに移動します。

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

追加 - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## 設定

### 基本設定

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Sign up automatically when the user does not exist - 既存のユーザーと一致するバインドが見つからない場合に、新しいユーザーを自動的に作成するかどうかを設定します。
- LDAP URL - LDAPサーバーのアドレスです。
- Bind DN - サーバー接続のテストとユーザー検索に使用するDNです。
- Bind password - Bind DNのパスワードです。
- Test connection - このボタンをクリックして、サーバー接続とBind DNの有効性をテストします。

### 検索設定

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN - ユーザー検索に使用するDNです。
- Search filter - ユーザー検索のフィルター条件です。ログイン時に使用するユーザーアカウントは `{{account}}` で表現します。
- Scope - `Base`、`One level`、`Subtree` のいずれかです。デフォルトは `Subtree` です。
- Size limit - 検索結果のページサイズです。

### 属性マッピング

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Use this field to bind the user - 既存のユーザーをバインドするために使用するフィールドです。ログインアカウントがユーザー名の場合は「ユーザー名」を、メールアドレスの場合は「メールアドレス」を選択します。デフォルトは「ユーザー名」です。
- Attribute map - ユーザー属性とNocoBaseのユーザーテーブルのフィールドとのマッピングです。

## ログイン

ログインページにアクセスし、ログインフォームにLDAPのユーザー名とパスワードを入力してログインします。

<img src="https://static-docs.nocobase.com/202405101614300.png"/>