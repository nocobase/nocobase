:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# Aliyun OSS
Aliyun OSS をベースにしたストレージエンジンです。ご利用の前に、関連するアカウントと権限をご準備いただく必要があります。

## 設定

![Aliyun OSS ストレージエンジンの設定例](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=ヒント}
ここでは、Aliyun OSS ストレージエンジン専用のパラメーターのみをご紹介します。共通パラメーターについては、[エンジン共通パラメーター](./index.md#common-engine-parameters)をご参照ください。
:::

### リージョン

OSS ストレージのリージョンを入力してください。例：`oss-cn-hangzhou`。

:::info{title=ヒント}
[Aliyun OSS コンソール](https://oss.console.aliyun.com/)でストレージバケットのリージョン情報を確認できます。リージョンのプレフィックス部分のみで構いません（完全なドメイン名は不要です）。
:::

### AccessKey ID

Aliyun の認可済みアクセスキーのIDを入力してください。

### AccessKey Secret

Aliyun の認可済みアクセスキーのシークレットを入力してください。

### バケット

OSS ストレージのバケット名を入力してください。