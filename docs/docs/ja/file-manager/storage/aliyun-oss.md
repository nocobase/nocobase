# ストレージエンジン：Aliyun OSS

Aliyun OSS をベースにしたストレージエンジンです。ご利用の前に、関連するアカウントと権限をご準備いただく必要があります。


:::warning 注意

このエンジンはプライベートアクセスに対応していません。ファイルのアップロード後、NocoBase は直接アクセス可能な URL を生成し、その URL を知っている人は誰でもファイルにアクセスできます。

OSS bucket 自体をプライベートに設定していても、NocoBase 組み込みの Aliyun OSS エンジンはファイルアクセス用の一時署名 URL を生成しません。プライベートアクセスが必要な場合は [S3 Pro](./s3-pro.md) を使用してください。既存ファイルがある場合は、[S3 Pro への移行](./migrate-to-s3-pro.md)を参照してください。

:::

## 設定パラメーター

![Aliyun OSS ストレージエンジン設定例](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=ヒント}
ここでは、Aliyun OSS ストレージエンジン固有のパラメーターのみを説明します。共通パラメーターについては、[エンジンの共通パラメーター](./index.md#共通パラメーター)を参照してください。
:::

### ベース URL

ファイルアクセス URL のプレフィックスを入力します。たとえば、現在の bucket にバインドしたカスタムドメイン `https://oss.example.com` です。Aliyun OSS のデフォルトドメインで PDF にアクセスすると、ブラウザーがダウンロードする場合があります。先にカスタムドメインをバインドすることを推奨します。詳しくは下記の[よくある問題](#よくある問題)を参照してください。

### リージョン

OSS ストレージのリージョンを入力します。例：`oss-cn-hangzhou`

:::info{title=ヒント}
[Aliyun OSS コンソール](https://oss.console.aliyun.com/)でストレージスペースのリージョン情報を確認できます。リージョンのプレフィックス部分のみで構いません（完全なドメイン名は不要です）。
:::

### AccessKey ID

Aliyun の認証アクセスキーのIDを入力します。

### AccessKey Secret

Aliyun の認証アクセスキーのSecretを入力します。

### バケット

OSS ストレージのバケット名を入力します。

### タイムアウト

Aliyun OSS へのアップロードのタイムアウト時間をミリ秒単位で入力します。デフォルトは `60000` ミリ秒（60 秒）です。

## よくある問題

### PDF がプレビューされずダウンロードされる

NocoBase はクロスオリジンの PDF を iframe でプレビューします。ブラウザーが OSS のファイル URL に直接アクセスするため、表示かダウンロードかは OSS のレスポンスヘッダーによって決まります。

iframe から PDF がダウンロードされる場合は、ブラウザーの開発者ツールにある「ネットワーク」でファイルリクエストを確認します。典型的な問題のあるレスポンスは次のとおりです。

```http
Content-Type: application/pdf
Content-Disposition: attachment
x-oss-force-download: true
```

`Content-Type: application/pdf` はファイル形式を正しく示していますが、`Content-Disposition: attachment` はブラウザーにダウンロードを指示します。Aliyun OSS のデフォルトドメインは一部の状況でダウンロードを強制します。Aliyun の公式ドキュメント [PDF ファイルへのアクセスをダウンロードではなくプレビューに設定する方法](https://help.aliyun.com/zh/oss/user-guide/how-do-i-configure-an-object-to-be-previewed-instead-of-downloaded)も参照してください。

次のように設定することを推奨します。

1. [カスタムドメインで OSS リソースにアクセスする](https://help.aliyun.com/zh/oss/user-guide/access-buckets-via-custom-domain-names)の手順で bucket にカスタムドメインをバインドする
2. DNS と HTTPS 証明書を設定し、カスタムドメインからファイルに直接アクセスできることを確認する
3. 使用する NocoBase ストレージエンジンのアクセス URL を設定する

第 3 ステップの設定は次のとおりです。

- 組み込みの「Aliyun OSS」エンジンでは、「ベース URL」にバインド済みのカスタムドメイン（例：`https://oss.example.com`）を設定する
- [S3 Pro](./s3-pro.md) で Aliyun OSS に接続する場合、アップロード endpoint は OSS のリージョン endpoint のままにできる。アクセス endpoint にはカスタムドメインを設定し、`Full access URL style` を `Ignore` に設定する

新しい PDF をアップロードして設定を確認します。既存のファイルレコードに完全な URL が保存されている場合は、フロントエンドに返される URL がカスタムドメインに切り替わっていることも確認してください。

:::tip レスポンスヘッダーの確認

クロスオリジン PDF の iframe プレビュー自体には CORS は不要です。PDF をインライン表示できるかどうかは、主に `Content-Type` と `Content-Disposition` で決まります。これは、下記のダウンロードボタンに必要な CORS とは別の問題です。

:::

### 画像はプレビューできるが、ダウンロードボタンで CORS エラーになる

画像は通常 `<img>`、クロスオリジン PDF は iframe でプレビューします。どちらも CORS レスポンスヘッダーがなくてもリソースを表示できます。ただし、ダウンロードボタンは `fetch` でファイルを読み込み、Blob を生成してブラウザーに渡します。このリクエストはブラウザーの同一オリジンポリシーの対象です。

コンソールに次のエラーが表示される場合、OSS が現在の NocoBase サイトに対して `Access-Control-Allow-Origin` を返していません。

```text
Access to fetch at 'https://oss.example.com/path/to/file.jpg' from origin
'https://example.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Aliyun の公式ドキュメント [CORS の設定](https://help.aliyun.com/zh/oss/user-guide/configure-cross-origin-resource-sharing)に従って bucket に CORS ルールを作成します。プレビューコンポーネントからダウンロードする場合は、次の値を使用できます。

| 設定項目 | 推奨値 |
| --- | --- |
| Allowed Origins | NocoBase の完全な origin（例：`https://example.com`） |
| Allowed Methods | `GET`、`HEAD` |
| Allowed Headers | `*` |
| Expose Headers | `ETag`、`Content-Disposition` |
| MaxAgeSeconds | `600` |

S3 Pro でブラウザーからファイルを直接アップロードする場合は、ブラウザーの「ネットワーク」に表示される実際のアップロードリクエストに応じて `PUT` や `POST` などを同じルールに追加するか、アップロード用のルールを別に作成します。

ルールを保存したら、NocoBase サイトの origin を指定してファイルを再度リクエストします。レスポンスには少なくとも次の内容が必要です。

```http
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, HEAD
```

ブラウザーが画像プレビュー用のレスポンスをすでにキャッシュしている場合があります。そのリクエストには `Origin` ヘッダーがなく、キャッシュ済みレスポンスに `Access-Control-Allow-Origin` が含まれていないことがあります。CORS の設定後もダウンロードに失敗する場合は、そのファイルのブラウザーキャッシュを削除するか、開発者ツールで「キャッシュを無効化」を選択して再試行してください。

### レスポンスヘッダーを確認する

`curl` を使って NocoBase サイトからのクロスオリジンリクエストを再現できます。例の origin、ファイル URL、署名パラメーターを実際の値に置き換えてください。

```bash
curl -sS -D - -o /dev/null \
  -H 'Origin: https://example.com' \
  'https://oss.example.com/path/to/file.pdf?<signed-query>'
```

次の内容を確認します。

- PDF プレビューが `Content-Type: application/pdf` を返し、`Content-Disposition: attachment` を含まない
- クロスオリジンダウンロードが NocoBase サイトと一致する `Access-Control-Allow-Origin` を返す
- 実際のファイル URL がデフォルトの `*.oss-cn-*.aliyuncs.com` ドメインではなく、カスタムドメインを使用している

`Origin` ヘッダーのないリクエストで CORS レスポンスヘッダーが返らないのは正常です。CORS の確認時は、例の `Origin` ヘッダーを残してください。

## 関連リンク

- [ファイルプレビュー](../file-preview/index.md)
- [S3 Pro](./s3-pro.md)
- [S3 Pro への移行](./migrate-to-s3-pro.md)
- [ストレージエンジン](./index.md)
