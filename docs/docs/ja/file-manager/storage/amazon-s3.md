# ストレージエンジン：Amazon S3

Amazon S3 をベースにしたストレージエンジンです。ご利用の前に、関連するアカウントと権限をご準備いただく必要があります。


:::warning 注意

このエンジンはプライベートアクセスに対応していません。ファイルのアップロード後、NocoBase は直接アクセス可能な URL を生成し、その URL を知っている人は誰でもファイルにアクセスできます。

S3 bucket 自体をプライベートに設定していても、NocoBase 組み込みの Amazon S3 エンジンはファイルアクセス用の一時署名 URL を生成しません。プライベートアクセスが必要な場合は [S3 Pro](./s3-pro) を使用してください。既存ファイルがある場合は、[S3 Pro への移行](./migrate-to-s3-pro.md)を参照してください。

:::

## 設定パラメーター

![Amazon S3 ストレージエンジンの設定例](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=ヒント}
ここでは、Amazon S3 ストレージエンジン専用のパラメーターのみをご紹介します。共通パラメーターについては、[共通エンジンパラメーター](./index#引擎通用参数)をご参照ください。
:::

### リージョン

S3 ストレージのリージョンを入力します。例：`us-west-1`

:::info{title=ヒント}
[Amazon S3 コンソール](https://console.aws.amazon.com/s3/)で、バケットのリージョン情報を確認できます。リージョンのプレフィックス部分のみで十分です（完全なドメイン名は不要です）。
:::

### AccessKey ID

Amazon S3 の AccessKey ID を入力します。

### AccessKey Secret

Amazon S3 の AccessKey Secret を入力します。

### バケット

S3 バケット名を入力します。