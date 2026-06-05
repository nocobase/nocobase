---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::



# 変数とシークレット

## はじめに

環境変数とシークレットを一元的に設定・管理することで、機密データの保存、設定データの再利用、環境設定の分離などを実現します。

## `.env` との違い

| **特徴**     | **`.env` ファイル**                                         | **動的に設定される環境変数とシークレット**                                             |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| **保存場所** | プロジェクトのルートディレクトリにある `.env` ファイルに保存されます。                        | データベースの `environmentVariables` テーブルに保存されます。                                 |
| **ロード方法** | アプリケーション起動時に `dotenv` などのツールを使って `process.env` にロードされます。 | 動的に読み込まれ、アプリケーション起動時に `app.environment` にロードされます。                        |
| **変更方法** | ファイルを直接編集する必要があり、変更を有効にするにはアプリケーションの再起動が必要です。            | 実行時に変更をサポートしており、アプリケーション設定をリロードするだけで変更が適用されます。                             |
| **環境分離** | 各環境（開発、テスト、本番）で `.env` ファイルを個別に管理する必要があります。    | 各環境（開発、テスト、本番）で `environmentVariables` テーブルのデータを個別に管理する必要があります。 |
| **適用シナリオ** | アプリケーションのメインデータベース情報など、固定された静的な設定に適しています。                  | 外部データベースやファイルストレージ情報など、頻繁な調整が必要な、またはビジネスロジックに紐づく動的な設定に適しています。 |

## インストール

組み込みのプラグインなので、個別のインストールは不要です。

## 用途

### 設定データの再利用

例えば、ワークフローの複数の箇所でメールノードが必要で、それぞれSMTPを設定する必要がある場合、共通のSMTP設定を環境変数に保存できます。

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### 機密データの保存

各種外部データベースのデータベース設定情報、クラウドファイルストレージのキーなどの機密データを保存できます。

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### 環境設定の分離

ソフトウェア開発、テスト、本番などの異なる環境において、それぞれの設定やデータが互いに干渉しないように、独立した設定管理戦略を使用します。各環境には独自の独立した設定、変数、リソースがあり、これにより開発、テスト、本番環境間の競合を回避し、システムが各環境で期待通りに動作することを保証します。

例えば、ファイルストレージサービスの設定は、開発環境と本番環境で異なる場合があります。以下に例を示します。

開発環境

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

本番環境

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## 環境変数管理

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### 環境変数の追加

- 単一追加と一括追加をサポートしています。
- 平文と暗号化の両方をサポートしています。

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

単一追加

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

一括追加

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## 注意事項

### アプリケーションの再起動

環境変数を変更または削除すると、上部にアプリケーションの再起動を促すメッセージが表示されます。環境変数への変更は、アプリケーションを再起動した後にのみ有効になります。

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### 暗号化ストレージ

環境変数の暗号化データにはAES対称暗号化が使用されます。暗号化と復号化のためのPRIVATE KEYはストレージディレクトリに保存されています。このキーは大切に保管してください。紛失したり上書きされたりすると、暗号化されたデータを復号化できなくなります。

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## 現在、環境変数をサポートしているプラグイン

### Action: カスタムリクエスト

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Auth: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Auth: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Auth: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Auth: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Auth: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Auth: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### データソース: 外部MariaDB

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### データソース: 外部MySQL

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### データソース: 外部Oracle

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### データソース: 外部PostgreSQL

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### データソース: 外部SQL Server

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### データソース: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### データソース: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### ファイルストレージ: ローカル

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### ファイルストレージ: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### ファイルストレージ: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### ファイルストレージ: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### ファイルストレージ: S3 Pro

未対応

### マップ: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### マップ: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### メール設定

未対応

### 通知: メール

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### 公開フォーム

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### システム設定

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### 認証: Aliyun SMS

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### 認証: Tencent SMS

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### ワークフロー

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)