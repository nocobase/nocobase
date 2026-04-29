---
title: "nb api ダイナミックコマンド"
description: "nb api ダイナミックコマンドリファレンス：NocoBase OpenAPI Schema から生成される CLI API コマンド。"
keywords: "nb api ダイナミックコマンド,NocoBase CLI,OpenAPI,swagger"
---

# nb api ダイナミックコマンド

[`nb api resource`](./resource/index.md) 以外に、`nb api` には NocoBase アプリケーションの OpenAPI Schema から動的に生成されるコマンドがあります。これらのコマンドは [`nb env add`](../env/add.md) または [`nb env update`](../env/update.md) を初めて実行した際に生成・キャッシュされます。

## 一般的なグループ

| コマンドグループ | 説明 |
| --- | --- |
| `nb api acl` | 権限管理：ロール、リソース権限、操作権限 |
| `nb api api-keys` | API Key 管理 |
| `nb api app` | アプリケーション管理 |
| `nb api authenticators` | 認証管理：パスワード、SMS、SSO など |
| `nb api data-modeling` | データモデリング：データソース、データテーブル、フィールド |
| `nb api file-manager` | ファイル管理：ストレージサービスと添付ファイル |
| `nb api flow-surfaces` | ページ構成：ページ、ブロック、フィールド、操作 |
| `nb api system-settings` | システム設定：タイトル、Logo、言語など |
| `nb api theme-editor` | テーマ管理：カラー、サイズ、テーマ切り替え |
| `nb api workflow` | ワークフロー：自動化プロセス管理 |

実際に利用可能なグループとコマンドは、接続先の NocoBase アプリケーションのバージョンと有効なプラグインによって異なります。現在のアプリケーションがサポートするコマンドを確認するには、以下を実行してください：

```bash
nb api --help
nb api <topic> --help
```

## リクエストボディパラメータ

リクエストボディを伴うダイナミックコマンドでは以下をサポートしています：

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--body` | string | JSON 文字列形式のリクエストボディ |
| `--body-file` | string | JSON ファイルのパス |

`--body` と `--body-file` は排他的です。

## 関連コマンド

- [`nb env update`](../env/update.md)
- [`nb api resource`](./resource/index.md)
