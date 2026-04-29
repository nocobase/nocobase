---
title: "NocoBase CLI"
description: "NocoBase CLI（nb コマンド）リファレンス：初期化、環境管理、アプリケーション実行、ソースコード、データベース、プラグイン、API、CLI セルフアップデート、Skills 管理。"
keywords: "NocoBase CLI,nb,コマンドライン,コマンドリファレンス,環境管理,プラグイン管理,API"
---

# NocoBase CLI

## 説明

NocoBase CLI（`nb`）は NocoBase のコマンドラインエントリーポイントです。ローカルワークスペースでの初期化、接続、NocoBase アプリケーションの管理に使用します。

以下の 2 つの一般的な初期化パスをサポートしています：

- 既存の NocoBase アプリケーションに接続し、CLI env として保存する
- Docker、npm、または Git で新しい NocoBase アプリケーションをインストールし、CLI env として保存する

新しいローカルアプリケーションを作成する際、[`nb init`](./init.md) は NocoBase AI coding skills のインストールまたは更新も行います。このステップをスキップするには、`--skip-skills` を使用してください。

## 使い方

```bash
nb [command]
```

ルートコマンド自体は主にヘルプの表示に使用され、コマンドグループまたは個別のコマンドに呼び出しを振り分けます。

## コマンドグループ（Topics）

`nb --help` で以下のコマンドグループが表示されます：

| コマンドグループ | 説明 |
| --- | --- |
| [`nb api`](./api/index.md) | CLI から NocoBase API を呼び出します。 |
| [`nb app`](./app/index.md) | アプリケーションのランタイム管理：起動、停止、再起動、ログ、アップグレード。 |
| [`nb db`](./db/index.md) | 選択した env の組み込みデータベースを管理します。 |
| [`nb env`](./env/index.md) | NocoBase プロジェクト環境、ステータス、詳細、ランタイムコマンドを管理します。 |
| [`nb plugin`](./plugin/index.md) | 選択した NocoBase env のプラグインを管理します。 |
| [`nb scaffold`](./scaffold/index.md) | NocoBase プラグイン開発のスキャフォールドを生成します。 |
| [`nb self`](./self/index.md) | NocoBase CLI 自体のチェックまたはアップデートを行います。 |
| [`nb skills`](./skills/index.md) | 現在のワークスペースの NocoBase AI coding skills のチェックまたは同期を行います。 |
| [`nb source`](./source/index.md) | ローカルソースコードプロジェクトの管理：ダウンロード、開発、ビルド、テスト。 |

## コマンド（Commands）

現在ルートコマンドが直接公開している個別コマンド：

| コマンド | 説明 |
| --- | --- |
| [`nb init`](./init.md) | NocoBase を初期化し、coding agent が接続して作業できるようにします。 |

## ヘルプの表示

ルートコマンドのヘルプを表示：

```bash
nb --help
```

特定のコマンドやコマンドグループのヘルプを表示：

```bash
nb init --help
nb app --help
nb api resource --help
```

## 使用例

インタラクティブな初期化：

```bash
nb init
```

ブラウザフォームで初期化：

```bash
nb init --ui
```

非インタラクティブで Docker アプリケーションを作成：

```bash
nb init --env app1 --yes --source docker --version alpha
```

既存のアプリケーションに接続：

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

アプリケーションを起動してランタイムコマンドを更新：

```bash
nb app start -e app1
nb env update app1
```

API を呼び出す：

```bash
nb api resource list --resource users -e app1
```

## 環境変数

以下の環境変数が CLI の動作に影響します：

| 変数 | 説明 |
| --- | --- |
| `NB_CLI_ROOT` | CLI が `.nocobase` 設定やローカルアプリケーションファイルを保存するルートディレクトリ。デフォルトは現在のユーザーのホームディレクトリです。 |
| `NB_LOCALE` | CLI のプロンプト言語およびローカル初期化 UI の言語。`en-US` と `zh-CN` をサポートしています。 |

使用例：

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## 設定ファイル

デフォルトの設定ファイル：

```text
~/.nocobase/config.json
```

`NB_CLI_ROOT=/your/workspace` を設定した場合、設定ファイルのパスは次のようになります：

```text
/your/workspace/.nocobase/config.json
```

CLI は現在の作業ディレクトリにある旧プロジェクト設定の読み取りにも対応しています。

ランタイムコマンドのキャッシュは以下に保存されます：

```text
.nocobase/versions/<hash>/commands.json
```

このファイルは [`nb env update`](./env/update.md) によって生成または更新され、ターゲットアプリケーションから同期されたランタイムコマンドをキャッシュするために使用されます。

## 関連リンク

- [クイックスタート](../../ai/quick-start.mdx)
- [インストール、アップグレード、マイグレーション](../../ai/install-upgrade-migration.mdx)
- [グローバル環境変数](../app/env.md)
- [AI ビルダー](../../ai-builder/index.md)
- [プラグイン開発](../../plugin-development/index.md)
