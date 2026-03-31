---
pkg: "@nocobase/plugin-logger"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::



pkg: '@nocobase/plugin-logger'
---

# ロギング

## はじめに

ログは、システムの問題を特定する上で重要な手段です。NocoBaseのサーバーログは、主にインターフェースリクエストログとシステム稼働ログで構成されており、ログレベル、ローリングポリシー、サイズ、出力形式などの設定をサポートしています。このドキュメントでは、NocoBaseのサーバーログに関する内容と、ログプラグインが提供するサーバーログのパッケージ化およびダウンロード機能の利用方法について説明します。

## ログ設定

ログレベル、出力方法、出力形式など、ログに関するパラメータは、[環境変数](/get-started/installation/env.md#logger_transport) を通じて設定できます。

## ログ形式

NocoBaseは、4種類の異なるログ形式の設定をサポートしています。

### `console`

開発環境でのデフォルト形式です。メッセージはハイライトカラーで表示されます。

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

本番環境でのデフォルト形式です。

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

区切り文字 `|` で区切られます。

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## ログディレクトリ

NocoBaseのログファイルの主なディレクトリ構造は以下の通りです。

- `storage/logs` - ログ出力ディレクトリ
  - `main` - メインアプリケーション名
    - `request_YYYY-MM-DD.log` - リクエストログ
    - `system_YYYY-MM-DD.log` - システムログ
    - `system_error_YYYY-MM-DD.log` - システムエラーログ
    - `sql_YYYY-MM-DD.log` - SQL実行ログ
    - ...
  - `sub-app` - サブアプリケーション名
    - `request_YYYY-MM-DD.log`
    - ...

## ログファイル

### リクエストログ

`request_YYYY-MM-DD.log` は、インターフェースのリクエストおよびレスポンスログです。

| フィールド          | 説明                                   |
| ------------- | -------------------------------------- |
| `level`       | ログレベル                             |
| `timestamp`   | ログ出力時刻 `YYYY-MM-DD hh:mm:ss`     |
| `message`     | `request` または `response`            |
| `userId`      | `response` にのみ存在                  |
| `method`      | リクエストメソッド                     |
| `path`        | リクエストパス                         |
| `req` / `res` | リクエスト/レスポンスの内容            |
| `action`      | リクエストされたリソースとパラメータ   |
| `status`      | レスポンスステータスコード             |
| `cost`        | リクエスト処理時間                     |
| `app`         | 現在のアプリケーション名               |
| `reqId`       | リクエストID                           |

:::info{title=ヒント}
`reqId` は `X-Request-Id` レスポンスヘッダーを通じてフロントエンドに渡されます。
:::

### システムログ

`system_YYYY-MM-DD.log` は、アプリケーション、ミドルウェア、プラグインなどのシステム稼働ログです。`error` レベルのログは `system_error_YYYY-MM-DD.log` に個別に記録されます。

| フィールド        | 説明                                   |
| ----------- | -------------------------------------- |
| `level`     | ログレベル                             |
| `timestamp` | ログ出力時刻 `YYYY-MM-DD hh:mm:ss`     |
| `message`   | ログメッセージ                         |
| `module`    | モジュール                             |
| `submodule` | サブモジュール                         |
| `method`    | 呼び出されたメソッド                   |
| `meta`      | その他の関連情報 (JSON形式)            |
| `app`       | 現在のアプリケーション名               |
| `reqId`     | リクエストID                           |

### SQL実行ログ

`sql_YYYY-MM-DD.log` は、データベースのSQL実行ログです。`INSERT INTO` ステートメントは、最初の2000文字のみが保持されます。

| フィールド        | 説明                                   |
| ----------- | -------------------------------------- |
| `level`     | ログレベル                             |
| `timestamp` | ログ出力時刻 `YYYY-MM-DD hh:mm:ss`     |
| `sql`       | SQLステートメント                      |
| `app`       | 現在のアプリケーション名               |
| `reqId`     | リクエストID                           |

## ログのパッケージ化とダウンロード

1. ログ管理ページに移動します。
2. ダウンロードしたいログファイルを選択します。
3. ダウンロードボタンをクリックします。

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## 関連ドキュメント

- [プラグイン開発 - サーバーサイド - ロギング](/plugin-development/server/logger)
- [APIリファレンス - @nocobase/logger](/api/logger/logger)