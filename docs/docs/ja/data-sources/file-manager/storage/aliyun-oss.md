---
title: "Alibaba Cloud OSS"
description: "Alibaba Cloud OSS ストレージエンジンの設定：Bucket、Endpoint、AccessKey。パブリックネットワークと内部ネットワークからのアクセスに対応しています。"
keywords: "Alibaba Cloud OSS,Alibaba Cloud オブジェクトストレージ,OSS ストレージ,クラウドストレージ,NocoBase"
---

# Alibaba Cloud OSS

Alibaba Cloud OSS に基づくストレージエンジンです。使用する前に、関連するアカウントと権限を準備する必要があります。

## 設定パラメータ

![Alibaba Cloud OSS ストレージエンジンの設定例](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=ヒント}
Alibaba Cloud OSS ストレージエンジン専用のパラメータのみを説明します。共通パラメータについては、[エンジン共通パラメータ](./index.md#引擎通用参数)を参照してください。
:::

### リージョン

OSS ストレージのリージョンを入力します。例：`oss-cn-hangzhou`。

:::info{title=ヒント}
[Alibaba Cloud OSS コンソール](https://oss.console.aliyun.com/)でストレージバケットのリージョン情報を確認できます。リージョンのプレフィックス部分のみを抜き出せばよく、完全なドメイン名を入力する必要はありません。
:::

### AccessKey ID

Alibaba Cloud の認証アクセスキー ID を入力します。

### AccessKey Secret

Alibaba Cloud の認証アクセスキー Secret を入力します。

### バケット

OSS ストレージのバケット名を入力します。