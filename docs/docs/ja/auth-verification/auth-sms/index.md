---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# SMS認証

## はじめに

SMS認証プラグインを使うと、ユーザーはSMSで登録し、NocoBaseにログインできるようになります。

> この機能は、[`@nocobase/plugin-verification` プラグイン](/auth-verification/verification/)が提供するSMS認証コード機能と組み合わせて使用する必要があります。

## SMS認証の追加

ユーザー認証プラグインの管理ページに移動します。

![](https://static-docs.nocobase.com/202502282112517.png)

「追加」-「SMS」

![](https://static-docs.nocobase.com/202502282113553.png)

## 新バージョンでの設定

:::info{title=ヒント}
新しい設定は`1.6.0-alpha.30`で導入され、`1.7.0`からは安定版としてサポートされる予定です。
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**検証器 (Verificator)：** SMS認証コードを送信するためのSMS検証器をバインドします。利用可能な検証器がない場合は、まず検証管理ページに移動してSMS検証器を作成する必要があります。
参照：

- [検証](../verification/index.md)
- [検証：SMS](../verification/sms/index.md)

**ユーザーが存在しない場合に自動登録 (Sign up automatically when the user does not exist)：** このオプションを有効にすると、ユーザーが使用する電話番号が存在しない場合、その電話番号をニックネームとして新しいユーザーが登録されます。

## 旧バージョンでの設定

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

SMSログイン認証機能は、設定済みでデフォルトに設定されているSMS認証コードプロバイダーを使用してSMSを送信します。

**ユーザーが存在しない場合に自動登録 (Sign up automatically when the user does not exist)：** このオプションを有効にすると、ユーザーが使用する電話番号が存在しない場合、その電話番号をニックネームとして新しいユーザーが登録されます。

## ログイン

ログインページにアクセスして使用します。

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)