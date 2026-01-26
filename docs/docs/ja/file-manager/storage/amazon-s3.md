:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ストレージエンジン：Amazon S3

Amazon S3 をベースにしたストレージエンジンです。ご利用の前に、関連するアカウントと権限をご準備いただく必要があります。

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