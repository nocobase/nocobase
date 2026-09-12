---
title: "ファイルマネージャー HTTP API"
description: "添付フィールドおよびファイルテーブルは、HTTP API によるファイルアップロードに対応しています。サーバー側アップロード（S3/OSS/COS）、クライアント側ダイレクトアップロード、JWT 認証、ストレージエンジンの指定をサポートします。"
keywords: "ファイルアップロード HTTP API,attachments create,サーバー側アップロード,クライアント側ダイレクトアップロード,NocoBase"
---

# HTTP API

添付フィールドとファイルテーブルのファイルアップロードはいずれも、HTTP API を通じて処理できます。添付フィールドまたはファイルテーブルで使用するストレージエンジンによって、呼び出し方法が異なります。

## サーバー側アップロード

S3、OSS、COS など、プロジェクトに組み込まれているオープンソースのストレージエンジンでは、HTTP API とユーザーインターフェースのアップロード機能で同じ API を呼び出し、すべてのファイルをサーバー経由でアップロードします。API を呼び出すには、`Authorization` リクエストヘッダーでユーザーログインに基づく JWT トークンを渡す必要があります。渡さない場合、アクセスは拒否されます。

### 添付フィールド

添付テーブル（`attachments`）のリソースに対して `create` 操作を実行し、POST 形式でリクエストを送信するとともに、`file` フィールドでバイナリデータをアップロードします。呼び出し後、ファイルはデフォルトのストレージエンジンにアップロードされます。

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

異なるストレージエンジンにファイルをアップロードする場合は、`attachmentField` パラメーターで、対象データテーブルのフィールドに設定されているストレージエンジンを指定できます（設定されていない場合は、デフォルトのストレージエンジンにアップロードされます）。

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### ファイルテーブル

ファイルテーブルへのアップロードでは、ファイルレコードが自動的に生成されます。ファイルテーブルのリソースに対して `create` 操作を実行し、POST 形式でリクエストを送信するとともに、`file` フィールドでバイナリデータをアップロードします。

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

ファイルテーブルへのアップロードでは、ストレージエンジンを指定する必要はありません。ファイルは、そのテーブルに設定されているストレージエンジンにアップロードされます。

## クライアント側ダイレクトアップロード

商用プラグイン S3-Pro が提供する S3 互換ストレージエンジンの場合、HTTP API によるアップロードはいくつかの手順に分けて実行する必要があります。

### 添付フィールド

1.  ストレージエンジン情報を取得する

    ストレージテーブル（`storages`）に対して `getBasicInfo` 操作を実行し、ストレージ名（storage name）を渡して、ストレージエンジンの設定情報をリクエストします。

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    返されるストレージエンジン設定情報の例：

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  プロバイダーの署名済み情報を取得する

    `fileStorageS3` リソースに対して `createPresignedUrl` 操作を実行し、POST 形式でリクエストを送信します。body にファイル関連情報を含めることで、署名済みアップロード情報を取得します。

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > 説明：
    >
    > * name: ファイル名
    > * size: ファイルサイズ（bytes 単位）
    > * type: ファイルの MIME タイプ。次を参照してください：[一般的な MIME タイプ](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: ストレージエンジンの ID（手順 1 で返される `id` フィールド）
    > * storageType: ストレージエンジンのタイプ（手順 1 で返される `type` フィールド）
    >
    > リクエストデータの例：
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    取得される署名済み情報のデータ構造は次のとおりです。

    ```json
    {
      "putUrl": "https://xxxxxxx",
      "fileInfo": {
        "key": "xxx",
        "title": "xxx",
        "filename": "xxx",
        "extname": ".png",
        "size": 4405,
        "mimetype": "image/png",
        "meta": {},
        "url": ""
      }
    }
    ```

3.  ファイルをアップロードする

    返された `putUrl` を使用して `PUT` リクエストを実行し、ファイルを body としてアップロードします。

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > 説明：
    > * putUrl：前の手順で返された `putUrl` フィールド
    > * file_path：アップロードするローカルファイルのパス
    >
    > リクエストデータの例：
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  ファイル行レコードを作成する

    アップロードが成功したら、添付テーブル（`attachments`）のリソースに対して `create` 操作を実行し、POST 形式でリクエストを送信してファイルレコードを作成します。

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > data-raw の依存データの説明：
    > * title: 前の手順で返された `fileInfo.title` フィールド
    > * filename: 前の手順で返された `fileInfo.key` フィールド
    > * extname: 前の手順で返された `fileInfo.extname` フィールド
    > * path: デフォルトでは空
    > * size: 前の手順で返された `fileInfo.size` フィールド
    > * url: デフォルトでは空
    > * mimetype: 前の手順で返された `fileInfo.mimetype` フィールド
    > * meta: 前の手順で返された `fileInfo.meta` フィールド
    > * storageId: 手順 1 で返された `id` フィールド
    >
    > リクエストデータの例：
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### ファイルテーブル

最初の 3 つの手順は添付フィールドのアップロードと同じですが、4 つ目の手順ではファイルレコードを作成する必要があります。ファイルテーブルのリソースに対して create 操作を実行し、POST 形式でリクエストを送信するとともに、body でファイル情報をアップロードします。

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> data-raw の依存データの説明：
> * title: 前の手順で返された `fileInfo.title` フィールド
> * filename: 前の手順で返された `fileInfo.key` フィールド
> * extname: 前の手順で返された `fileInfo.extname` フィールド
> * path: デフォルトでは空
> * size: 前の手順で返された `fileInfo.size` フィールド
> * url: デフォルトでは空
> * mimetype: 前の手順で返された `fileInfo.mimetype` フィールド
> * meta: 前の手順で返された `fileInfo.meta` フィールド
> * storageId: 手順 1 で返された `id` フィールド
>
> リクエストデータの例：
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```