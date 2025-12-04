:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# HTTP API

添付ファイルフィールドとファイルコレクションへのファイルアップロードは、HTTP API を介して行うことができます。添付ファイルフィールドまたはファイルコレクションが使用するストレージエンジンによって、呼び出し方法が異なります。

## サーバーサイドアップロード

プロジェクトに組み込まれている S3、OSS、COS などのオープンソースのストレージエンジンでは、HTTP API を使ったアップロードはユーザーインターフェースからのアップロードと同じように機能し、ファイルはすべてサーバー経由でアップロードされます。API を呼び出す際には、ユーザーログインに基づく JWT トークンを `Authorization` リクエストヘッダーに含める必要があります。含めないと、アクセスは拒否されます。

### 添付ファイルフィールド

添付ファイルテーブル（`attachments`）リソースに対して `create` 操作を実行し、POST リクエストを送信します。`file` フィールド経由でバイナリコンテンツをアップロードすると、ファイルはデフォルトのストレージエンジンにアップロードされます。

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

ファイルを別のストレージエンジンにアップロードしたい場合は、`attachmentField` パラメーターを使って、対象のコレクションフィールドに設定されているストレージエンジンを指定できます（設定されていない場合は、デフォルトのストレージエンジンにアップロードされます）。

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### ファイルコレクション

ファイルコレクションにアップロードすると、自動的にファイルレコードが生成されます。ファイルコレクションリソースに対して `create` 操作を実行し、POST リクエストを送信して、`file` フィールド経由でバイナリコンテンツをアップロードしてください。

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

ファイルコレクションにアップロードする際、ストレージエンジンを指定する必要はありません。ファイルは、そのコレクションに設定されているストレージエンジンにアップロードされます。

## クライアントサイドアップロード

商用プラグイン S3-Pro を介して提供される S3 互換のストレージエンジンでは、HTTP API を使ったアップロードはいくつかのステップに分けて実行する必要があります。

### 添付ファイルフィールド

1.  ストレージエンジン情報の取得

    `storages` コレクションに対して `getBasicInfo` 操作を実行し、ストレージ名（storage name）を渡してストレージエンジンの設定情報をリクエストします。

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    返されるストレージエンジンの設定情報の例：

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  サービスプロバイダーからの署名付きURL情報の取得

    `fileStorageS3` リソースに対して `createPresignedUrl` 操作を実行し、POST リクエストを送信します。リクエストボディにファイル関連情報を含めることで、署名付きアップロード情報を取得できます。

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
    > * size: ファイルサイズ（バイト単位）
    > * type: ファイルの MIME タイプ。詳細は [一般的な MIME タイプ](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types) を参照してください。
    > * storageId: ストレージエンジンのID（最初のステップで返される `id` フィールド）
    > * storageType: ストレージエンジンのタイプ（最初のステップで返される `type` フィールド）
    > 
    > リクエストデータの例：
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    取得される署名付き情報のデータ構造は以下の通りです。

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

3.  ファイルのアップロード

    返された `putUrl` を使って `PUT` リクエストを送信し、ファイルをボディとしてアップロードします。

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > 説明：
    > * putUrl：前のステップで返された `putUrl` フィールド
    > * file_path：アップロードするローカルファイルのパス
    > 
    > リクエストデータの例：
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  ファイルレコードの作成

    アップロードが成功したら、添付ファイルテーブル（`attachments`）リソースに対して `create` 操作を実行し、POST リクエストを送信してファイルレコードを作成します。

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > `data-raw` 内の依存データについて：
    > * title: 前のステップで返された `fileInfo.title` フィールド
    > * filename: 前のステップで返された `fileInfo.key` フィールド
    > * extname: 前のステップで返された `fileInfo.extname` フィールド
    > * path: デフォルトは空
    > * size: 前のステップで返された `fileInfo.size` フィールド
    > * url: デフォルトは空
    > * mimetype: 前のステップで返された `fileInfo.mimetype` フィールド
    > * meta: 前のステップで返された `fileInfo.meta` フィールド
    > * storageId: 最初のステップで返された `id` フィールド
    > 
    > リクエストデータの例：
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### ファイルコレクション

最初の3つのステップは添付ファイルフィールドのアップロードと同じですが、4番目のステップではファイルレコードを作成する必要があります。ファイルコレクションリソースに対して `create` 操作を実行し、POST リクエストを送信して、ボディ経由でファイル情報をアップロードします。

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> `data-raw` 内の依存データについて：
> * title: 前のステップで返された `fileInfo.title` フィールド
> * filename: 前のステップで返された `fileInfo.key` フィールド
> * extname: 前のステップで返された `fileInfo.extname` フィールド
> * path: デフォルトは空
> * size: 前のステップで返された `fileInfo.size` フィールド
> * url: デフォルトは空
> * mimetype: 前のステップで返された `fileInfo.mimetype` フィールド
> * meta: 前のステップで返された `fileInfo.meta` フィールド
> * storageId: 最初のステップで返された `id` フィールド
> 
> リクエストデータの例：
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```