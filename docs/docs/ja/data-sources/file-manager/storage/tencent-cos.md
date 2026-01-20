:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# Tencent COS

Tencent Cloud COS をベースにしたストレージエンジンです。ご利用の前に、関連するアカウントと権限をご準備ください。

## 設定オプション

![Tencent COS ストレージエンジンの設定例](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=ヒント}
ここではTencent Cloud COS ストレージエンジン固有のパラメータのみを説明しています。共通パラメータについては、[エンジンの共通パラメータ](./index.md#エンジンの共通パラメータ)をご参照ください。
:::

### リージョン

COS ストレージのリージョンを入力します。例: `ap-chengdu`

:::info{title=ヒント}
[Tencent Cloud COS コンソール](https://console.cloud.tencent.com/cos)でストレージバケットのリージョン情報を確認できます。リージョンのプレフィックス部分のみを抽出してください（完全なドメイン名は不要です）。
:::

### SecretId

Tencent Cloud 認証アクセスキーの ID を入力します。

### SecretKey

Tencent Cloud 認証アクセスキーの Secret を入力します。

### バケット

COS ストレージのバケット名を入力します。例: `qing-cdn-1234189398`