---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# 通知：WeCom

## はじめに

**WeCom**プラグインは、アプリケーションがWeComユーザーに通知メッセージを送信できるようにします。

## WeCom認証器の追加と設定

まず、NocoBaseでWeCom認証器を追加し、設定する必要があります。[ユーザー認証 - WeCom](/auth-verification/auth-wecom) を参照してください。WeCom経由でログインしたシステムユーザーのみが、WeComを通じてシステム通知を受け取ることができます。

## WeCom通知チャンネルの追加

![](https://static-docs.nocobase.com/202412041522365.png)

## WeCom通知チャンネルの設定

先ほど設定した認証器を選択します。

![](https://static-docs.nocobase.com/202412041525284.png)

## ワークフロー通知ノードの設定

設定済みのWeCom通知チャンネルを選択します。テキストカード、Markdown、テンプレートカードの3種類のメッセージタイプに対応しています。

![](https://static-docs.nocobase.com/202412041529319.png)