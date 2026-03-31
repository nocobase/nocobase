---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# REST API データソース

## はじめに

このプラグインを使うと、REST API からのデータをシームレスに連携できます。

## インストール

このプラグインは商用プラグインのため、プラグインマネージャーからアップロードして有効化する必要があります。

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## REST API データソースの追加

プラグインを有効化した後、データソース管理の「新規追加」ドロップダウンメニューから「REST API」を選択して、REST API データソースを追加できます。

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

REST API データソースを設定します。

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## コレクションの追加

NocoBase では、RESTful なリソースはコレクションにマッピングされます。例えば、Users リソースの場合です。

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

これらのAPIエンドポイントは、NocoBase API では次のようにマッピングされます。

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

NocoBase API の設計仕様に関する詳細なガイドについては、API ドキュメントを参照してください。

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

詳細については、「NocoBase API - Core」の章をご確認ください。

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

REST API データソースのコレクション設定は以下の通りです。

### List

リソースのリストを表示するためのインターフェースをマッピングします。

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Get

リソースの詳細を表示するためのインターフェースをマッピングします。

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Create

リソースを作成するためのインターフェースをマッピングします。

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Update

リソースを更新するためのインターフェースをマッピングします。
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Destroy

リソースを削除するためのインターフェースをマッピングします。

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

List と Get の両インターフェースは、必須で設定する必要があります。

## API のデバッグ

### リクエストパラメータの連携

例: List インターフェースにページネーションパラメータを設定します。（もしサードパーティAPIがページネーションをネイティブでサポートしていない場合、NocoBase は取得したリストデータに基づいてページネーションを行います。）

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

インターフェースに追加された変数のみが有効になることにご注意ください。

| サードパーティAPIのパラメータ名 | NocoBase のパラメータ       |
| ------------------------------- | --------------------------- |
| page                            | {{request.params.page}}     |
| limit                           | {{request.params.pageSize}} |

「Try it out」をクリックしてデバッグし、レスポンス結果を確認できます。

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### レスポンス形式の変換

サードパーティAPIのレスポンス形式は NocoBase の標準ではない場合があり、フロントエンドで正しく表示するためには変換が必要です。

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

サードパーティAPIのレスポンス形式に基づいて変換ルールを調整し、NocoBase の出力標準に準拠するようにします。

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

デバッグプロセスの説明

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## 変数

REST API データソースは、API 連携のために3種類の変数を提供しています。

- データソースのカスタム変数
- NocoBase リクエスト変数
- サードパーティレスポンス変数

### データソースのカスタム変数

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### NocoBase リクエスト

- Params：URL クエリパラメータ（Search Params）です。各インターフェースによって異なります。
- Headers：リクエストヘッダーです。主に NocoBase 独自の X- 情報を提供します。
- Body：リクエストボディです。
- Token：現在の NocoBase リクエストの API トークンです。

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### サードパーティレスポンス

現在、レスポンスボディのみが提供されています。

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

各インターフェース連携時に利用可能な変数は以下の通りです。

### List

| パラメータ                  | 説明                                                       |
| --------------------------- | ---------------------------------------------------------- |
| request.params.page         | 現在のページ番号                                           |
| request.params.pageSize     | 1ページあたりの項目数                                      |
| request.params.filter       | フィルター条件（NocoBase のフィルター形式に準拠する必要があります） |
| request.params.sort         | ソートルール（NocoBase のソート形式に準拠する必要があります）   |
| request.params.appends      | オンデマンドで読み込むフィールド。通常、関連フィールドのオンデマンド読み込みに使用されます。 |
| request.params.fields       | インターフェースが出力するフィールド（ホワイトリスト）     |
| request.params.except       | 除外するフィールド（ブラックリスト）                       |

### Get

| パラメータ                      | 説明                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk       | 必須。通常、現在のデータIDです。                           |
| request.params.filter           | フィルター条件（NocoBase のフィルター形式に準拠する必要があります） |
| request.params.appends          | オンデマンドで読み込むフィールド。通常、関連フィールドのオンデマンド読み込みに使用されます。 |
| request.params.fields           | インターフェースが出力するフィールド（ホワイトリスト）     |
| request.params.except           | 除外するフィールド（ブラックリスト）                       |

### Create

| パラメータ                     | 説明             |
| ------------------------------ | ---------------- |
| request.params.whiteList       | ホワイトリスト   |
| request.params.blacklist       | ブラックリスト   |
| request.body                   | 作成する初期データ |

### Update

| パラメータ                      | 説明                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk       | 必須。通常、現在のデータIDです。                           |
| request.params.filter           | フィルター条件（NocoBase のフィルター形式に準拠する必要があります） |
| request.params.whiteList        | ホワイトリスト                                             |
| request.params.blacklist        | ブラックリスト                                             |
| request.body                    | 更新するデータ                                             |

### Destroy

| パラメータ                      | 説明                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk       | 必須。通常、現在のデータIDです。                           |
| request.params.filter           | フィルター条件（NocoBase のフィルター形式に準拠する必要があります） |

## フィールドの設定

適応されたリソースの CRUD インターフェースデータから、フィールドのメタデータ（Fields）をコレクションのフィールドとして抽出します。

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

フィールドのメタデータを抽出します。

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

フィールドとプレビュー。

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

フィールドを編集します（他のデータソースと同様の方法です）。

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## REST API データソースブロックの追加

コレクションの設定が完了したら、インターフェースにブロックを追加できます。

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)