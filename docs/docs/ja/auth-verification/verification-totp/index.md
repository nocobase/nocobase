---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# 認証：TOTP 認証器

## はじめに

TOTP 認証器は、TOTP (Time-based One-Time Password) 規格 (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>) に準拠する任意の認証器をユーザーがバインドし、時間ベースのワンタイムパスワード (TOTP) を使って本人確認を行うことを可能にします。

## 管理者設定

認証管理ページにアクセスします。

![](https://static-docs.nocobase.com/202502271726791.png)

追加 - TOTP 認証器

![](https://static-docs.nocobase.com/202502271745028.png)

ユニークな識別子とタイトル以外に、TOTP 認証器にはその他の設定は必要ありません。

![](https://static-docs.nocobase.com/202502271746034.png)

## ユーザーのバインド

認証器を追加した後、ユーザーは個人設定の認証管理で TOTP 認証器をバインドできます。

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
現在、このプラグインにはリカバリーコードの仕組みは提供されていません。TOTP 認証器をバインドした後は、ユーザー自身で適切に保管してください。万が一、認証器を紛失してしまった場合は、他の認証方法で本人確認を行い、認証器を解除してから再度バインドすることができます。
:::

## ユーザーのバインド解除

認証器のバインドを解除するには、すでにバインドされている認証方法で本人確認を行う必要があります。

![](https://static-docs.nocobase.com/202502282103205.png)