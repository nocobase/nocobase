---
pkg: "@nocobase/plugin-wecom"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# WeChat Workからユーザーデータを同期する

## はじめに

**WeChat Work** プラグインを使うと、WeChat Workからユーザーデータと部署データを同期できます。

## WeChat Workカスタムアプリケーションの作成と設定

まず、WeChat Work管理コンソールでカスタムアプリケーションを作成し、**企業ID**、**AgentId**、**Secret**を取得します。

詳細は[ユーザー認証 - WeChat Work](/auth-verification/auth-wecom/)を参照してください。

## NocoBaseに同期データソースを追加する

「ユーザーと権限」→「同期」→「追加」の順に進み、取得した関連情報を入力します。

![](https://static-docs.nocobase.com/202412041251867.png)

## 連絡先同期の設定

WeChat Work管理コンソールにアクセスし、「セキュリティと管理」→「管理ツール」の順に進んで「連絡先同期」をクリックします。

![](https://static-docs.nocobase.com/202412041249958.png)

図のように設定し、企業の信頼済みIPを設定します。

![](https://static-docs.nocobase.com/202412041250776.png)

これでユーザーデータの同期を実行できます。

## イベント受信サーバーの設定

WeChat Work側でのユーザーや部署データの変更をNocoBaseアプリケーションにタイムリーに同期したい場合は、さらに設定を進めることができます。

前述の設定情報を入力した後、連絡先コールバック通知URLをコピーできます。

![](https://static-docs.nocobase.com/202412041256547.png)

WeChat Workの設定に入力し、TokenとEncodingAESKeyを取得して、NocoBaseのユーザー同期データソース設定を完了します。

![](https://static-docs.nocobase.com/202412041257947.png)