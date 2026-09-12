---
title: "REST API データソース"
description: "REST API のデータソースに接続し、RESTful リソースを Collection にマッピングします。List/Get/Create/Update/Destroy インターフェースのマッピングを設定し、CRUD 操作をサポートします。"
keywords: "REST API データソース,外部 API,インターフェースマッピング,Collection マッピング,NocoBase"
---

# REST API データソース

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

## 概要

REST API をデータソースとして接続するために使用します。

## インストール

このプラグインは商用プラグインです。詳しい有効化方法については、[商用プラグインの有効化ガイド](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)を参照してください。

## REST API ソースの追加

プラグインを有効化した後、データソース管理の「Add new」ドロップダウンメニューから「REST API」を選択します。

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

REST API ソースを設定します。

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Collection の追加

RESTful リソースは NocoBase の Collection に対応します。たとえば、Users リソースです。

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

NocoBase API でのマッピング設定は次のとおりです。

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

NocoBase API の完全な設計仕様については、API ドキュメントを参照してください。

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

「NocoBase API - Core」セクションを参照してください。

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

REST API データソースの Collection 設定は次のとおりです。

### List

リソース一覧を取得するインターフェースのマッピングを設定します。

![20251201162457](https://static-docs.nocobase.com/20251201162457.png)

### Get

リソースの詳細を取得するインターフェースのマッピングを設定します。

![20251201162744](https://static-docs.nocobase.com/20251201162744.png)

### Create

リソースを作成するインターフェースのマッピングを設定します。

![20251201163000](https://static-docs.nocobase.com/20251201163000.png)

### Update

リソースを更新するインターフェースのマッピングを設定します。
![20251201163058](https://static-docs.nocobase.com/20251201163058.png)

### Destroy

リソースを削除するインターフェースのマッピングを設定します。

![20251201163204](https://static-docs.nocobase.com/20251201163204.png)

List と Get は必ず設定する必要がある 2 つのインターフェースです。
## API のデバッグ

### リクエストパラメータの連携

例：List インターフェースにページネーションパラメータを設定します（サードパーティ API 自体がページネーションをサポートしていない場合は、取得した一覧データをページ分割します）。

![20251201163500](https://static-docs.nocobase.com/20251201163500.png)

インターフェースに追加されている変数のみ有効になる点に注意してください。

| サードパーティ API の接続パラメータ名 | NocoBase パラメータ           |
| ------------------------------------- | ----------------------------- |
| page                                  | {{request.params.page}}       |
| limit                                 | {{request.params.pageSize}}   |

「Try it out」をクリックしてデバッグし、レスポンス結果を確認できます。

![20251201163635](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### レスポンス形式の変換

サードパーティ API のレスポンス形式は NocoBase の標準と異なる場合があるため、変換してからでないとフロントエンドに正しく表示できません。

![20251201164529](https://static-docs.nocobase.com/20251201164529.png)

サードパーティ API のレスポンス形式に応じて変換ルールを調整し、NocoBase の出力標準に適合させます。

![20251201164629](https://static-docs.nocobase.com/20251201164629.png)

デバッグ手順の説明

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

### エラー情報の変換

サードパーティ API でエラーが発生した場合、レスポンスのエラー情報の形式が NocoBase の標準と異なる可能性があるため、変換してからでないとフロントエンドに正しく表示できません。

![20251201170545](https://static-docs.nocobase.com/20251201170545.png)

エラー情報の変換を設定していない場合、デフォルトで HTTP ステータスコードを含むエラー情報に変換されます。

![20251201170732](https://static-docs.nocobase.com/20251201170732.png)

エラー情報の変換を設定すると、NocoBase の出力標準に適合させることができ、フロントエンドにサードパーティ API のエラー情報を正しく表示できます。

![20251201170946](https://static-docs.nocobase.com/20251201170946.png)
![20251201171113](https://static-docs.nocobase.com/20251201171113.png)

## 変数

REST API データソースでは、インターフェース連携に使用する 3 種類の変数が提供されています。

- データソースのカスタム変数
- NocoBase リクエスト
- サードパーティレスポンス

### データソースのカスタム変数

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### NocoBase リクエスト

- Params：URL クエリパラメータ（Search Params）。インターフェースごとに Params は異なります。
- Headers：リクエストヘッダー。主に NocoBase 固有の X- 情報を提供します。
- Body：リクエストの Body。
- Token：現在の NocoBase リクエストの API トークン。

![20251201164833](https://static-docs.nocobase.com/20251201164833.png)

### サードパーティレスポンス

現在提供されているのはレスポンスの Body のみです。

![20251201164915](https://static-docs.nocobase.com/20251201164915.png)

各インターフェースの連携時に使用できる変数は次のとおりです。

### List

| パラメータ              | 説明                                             |
| ----------------------- | ------------------------------------------------ |
| request.params.page     | 現在のページ番号                                 |
| request.params.pageSize | 1 ページあたりの件数                             |
| request.params.filter   | フィルター条件（NocoBase の Filter 形式に準拠） |
| request.params.sort     | ソートルール（NocoBase の Sort 形式に準拠）     |
| request.params.appends  | 必要に応じて読み込むフィールド。通常はリレーションフィールドの遅延読み込みに使用 |
| request.params.fields   | インターフェースで出力するフィールド（ホワイトリスト） |
| request.params.except   | 除外するフィールド（ブラックリスト）           |

### Get

| パラメータ                | 説明                                             |
| ------------------------- | ------------------------------------------------ |
| request.params.filterByTk | 必須。通常は現在のデータの ID                   |
| request.params.filter     | フィルター条件（NocoBase の Filter 形式に準拠） |
| request.params.appends    | 必要に応じて読み込むフィールド。通常はリレーションフィールドの遅延読み込みに使用 |
| request.params.fields     | インターフェースで出力するフィールド（ホワイトリスト） |
| request.params.except     | 除外するフィールド（ブラックリスト）           |

### Create

| パラメータ               | 説明             |
| ------------------------ | ---------------- |
| request.params.whiteList | ホワイトリスト   |
| request.params.blacklist | ブラックリスト   |
| request.body             | 作成する初期データ |

### Update

| パラメータ                | 説明                                             |
| ------------------------- | ------------------------------------------------ |
| request.params.filterByTk | 必須。通常は現在のデータの ID                   |
| request.params.filter     | フィルター条件（NocoBase の Filter 形式に準拠） |
| request.params.whiteList  | ホワイトリスト                                  |
| request.params.blacklist  | ブラックリスト                                  |
| request.body              | 更新するデータ                                   |

### Destroy

| パラメータ                | 説明                                             |
| ------------------------- | ------------------------------------------------ |
| request.params.filterByTk | 必須。通常は現在のデータの ID                   |
| request.params.filter     | フィルター条件（NocoBase の Filter 形式に準拠） |

## フィールドの設定

接続先リソースに対応する CRUD インターフェースのデータから、フィールドのメタデータ（Fields）を抽出して Collection のフィールドとして使用します。

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

フィールドのメタデータを抽出します。

![20251201165133](https://static-docs.nocobase.com/20251201165133.png)

フィールドとプレビュー。

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

フィールドを編集します（他のデータソースと同様の方法です）。

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## REST API データソースブロックの追加

Collection の設定が完了したら、画面にブロックを追加できます。

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)