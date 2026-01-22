:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# HTTP API

添付ファイルフィールドとファイルコレクションのファイルアップロードは、どちらもHTTP APIで処理できます。添付ファイルやファイルコレクションが利用するストレージエンジンによって、呼び出し方法がそれぞれ異なります。

## サーバーサイドアップロード

S3、OSS、COSなど、プロジェクトに組み込まれているオープンソースのストレージエンジンの場合、HTTP APIはUIのアップロード機能と同じように呼び出され、ファイルはすべてサーバーサイドでアップロードされます。APIを呼び出す際には、ユーザーログインに基づくJWTトークンを`Authorization`リクエストヘッダーに含める必要があります。含めないとアクセスが拒否されますのでご注意ください。

### 添付ファイルフィールド

添付ファイルコレクション（`attachments`）リソースに対して`create`操作を実行し、POSTリクエストを送信して`file`フィールドからバイナリコンテンツをアップロードします。この呼び出し後、ファイルはデフォルトのストレージエンジンにアップロードされます。

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

異なるストレージエンジンにファイルをアップロードしたい場合は、`attachmentField`パラメーターを使って、所属するコレクションフィールドに設定されているストレージエンジンを指定できます（設定されていない場合は、デフォルトのストレージエンジンにアップロードされます）。

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### ファイルコレクション

ファイルコレクションにアップロードすると、自動的にファイルレコードが生成されます。ファイルコレクションリソースに対して`create`操作を実行し、POSTリクエストを送信して`file`フィールドからバイナリコンテンツをアップロードしてください。

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

ファイルコレクションへのアップロードでは、ストレージエンジンを指定する必要はありません。ファイルは、そのコレクションに設定されているストレージエンジンにアップロードされます。

## クライアントサイドアップロード

商用プラグイン S3-Pro を通じて提供されるS3互換のストレージエンジンの場合、HTTP APIでのアップロードはいくつかのステップに分けて呼び出す必要があります。

### 添付ファイルフィールド

1.  ストレージエンジン情報の取得

    ストレージコレクション（`storages`）に対して`getBasicInfo`操作を実行し、ストレージ名（storage name）を含めてストレージエンジンの設定情報をリクエストします。

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

2.  サービスプロバイダーからプリサイン情報（Presigned URL）を取得

    `fileStorageS3`リソースに対して`createPresignedUrl`操作を実行し、POSTリクエストを送信してbodyにファイル関連情報を含め、プリサインアップロード情報を取得します。

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > 注：
    >
    > *   `name`: ファイル名
    > *   `size`: ファイルサイズ（バイト単位）
    > *   `type`: ファイルのMIMEタイプです。参考：[一般的なMIMEタイプ](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: ストレージエンジンのID（ステップ1で返される`id`フィールド）
    > *   `storageType`: ストレージエンジンのタイプ（ステップ1で返される`type`フィールド）
    >
    > リクエストデータの例：
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    取得したプリサイン情報のデータ構造は以下の通りです。

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

    返された`putUrl`を使って`PUT`リクエストを実行し、ファイルをbodyとしてアップロードします。

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > 注：
    > *   `putUrl`: 前のステップで返された`putUrl`フィールド
    > *   `file_path`: アップロードするローカルファイルのパス
    >
    > リクエストデータの例：
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  ファイルレコードの作成

    アップロードが成功したら、添付ファイルコレクション（`attachments`）リソースに対して`create`操作を実行し、POSTリクエストを送信してファイルレコードを作成します。

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > data-rawの依存データについて：
    > *   `title`: 前のステップで返された`fileInfo.title`フィールド
    > *   `filename`: 前のステップで返された`fileInfo.key`フィールド
    > *   `extname`: 前のステップで返された`fileInfo.extname`フィールド
    > *   `path`: デフォルトは空
    > *   `size`: 前のステップで返された`fileInfo.size`フィールド
    > *   `url`: デフォルトは空
    > *   `mimetype`: 前のステップで返された`fileInfo.mimetype`フィールド
    > *   `meta`: 前のステップで返された`fileInfo.meta`フィールド
    > *   `storageId`: ステップ1で返された`id`フィールド
    >
    > リクエストデータの例：
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### ファイルコレクション

最初の3つのステップは添付ファイルフィールドへのアップロードと同じです。ただし、4番目のステップでは、ファイルコレクションリソースに対して`create`操作を実行し、POSTリクエストを送信してbodyにファイル情報をアップロードすることで、ファイルレコードを作成する必要があります。

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> data-rawの依存データについて：
> *   `title`: 前のステップで返された`fileInfo.title`フィールド
> *   `filename`: 前のステップで返された`fileInfo.key`フィールド
> *   `extname`: 前のステップで返された`fileInfo.extname`フィールド
> *   `path`: デフォルトは空
> *   `size`: 前のステップで返された`fileInfo.size`フィールド
> *   `url`: デフォルトは空
> *   `mimetype`: 前のステップで返された`fileInfo.mimetype`フィールド
> *   `meta`: 前のステップで返された`fileInfo.meta`フィールド
> *   `storageId`: ステップ1で返された`id`フィールド
>
> リクエストデータの例：
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```