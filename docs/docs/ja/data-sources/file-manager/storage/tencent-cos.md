---
title: "Tencent Cloud COS"
description: "Tencent Cloud COSストレージエンジンの設定：Bucket、Region、SecretId、オブジェクトストレージへのファイルアップロード。"
keywords: "Tencent Cloud COS,Tencent Cloudオブジェクトストレージ,COSストレージ,クラウドストレージ,NocoBase"
---

# Tencent Cloud COS

Tencent Cloud COSに基づくストレージエンジンです。使用する前に、関連するアカウントと権限を準備する必要があります。

## 設定パラメーター

![Tencent Cloud COSストレージエンジンの設定例](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=ヒント}
Tencent Cloud COSストレージエンジン専用のパラメーターのみを説明します。共通パラメーターについては、[エンジン共通パラメーター](./index.md#引擎通用参数)を参照してください。
:::

### リージョン

COSストレージのリージョンを入力します。例：`ap-chengdu`。

:::info{title=ヒント}
[腾讯云 COSコンソール](https://console.cloud.tencent.com/cos)でバケットのリージョン情報を確認できます。リージョンのプレフィックス部分のみを抜き出して入力してください（完全なドメイン名を入力する必要はありません）。
:::

### SecretId

Tencent Cloudへのアクセスを許可するアクセスキーのIDを入力します。

### SecretKey

Tencent Cloudへのアクセスを許可するアクセスキーのSecretを入力します。

### バケット

COSストレージのバケット名を入力します。例：`qing-cdn-1234189398`。