---
title: 'NocoBase CLI'
description: 'NocoBase CLI（`nb` コマンド）リファレンス：初期化、バックアップと復元、設定、環境管理、アプリ実行、ソースコード、データベース、プラグイン、商用ライセンス、API、CLI セルフアップデート、Skills 管理。'
keywords: 'NocoBase CLI,nb,コマンドライン,コマンドリファレンス,バックアップ,復元,環境管理,プラグイン管理,商用ライセンス,API'
---

# NocoBase CLI

## 概要

NocoBase CLI（`nb`）は NocoBase のコマンドラインエントリーポイントであり、ローカルワークスペースで NocoBase アプリケーションを初期化、接続、管理するために使用されます。

主な初期化パスは 2 つあります。

- 既存の NocoBase アプリケーションに接続し、CLI env として保存する
- Docker、npm、または Git を使って新しい NocoBase アプリケーションをインストールし、その後 CLI env として保存する

新しいローカルアプリケーションを作成するとき、[`nb init`](./init.md) は NocoBase AI coding skills をインストールまたは更新することもできます。この手順をスキップするには、`--skip-skills` を使用します。

## 使い方

```bash
nb [command]
```

ルートコマンド自体は主にヘルプの表示に使われ、呼び出しをコマンドグループまたは単独コマンドに振り分けます。

## コマンドグループ（Topics）

`nb --help` には以下のコマンドグループが表示されます。

| コマンドグループ                     | 説明                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| [`nb api`](./api/index.md)           | CLI から NocoBase API を呼び出します。                                                                      |
| [`nb app`](./app/index.md)           | アプリ実行状態を管理します：起動、停止、再起動、ログ、アップグレード。                                      |
| [`nb backup`](./backup/index.md)     | バックアップを作成してローカルにダウンロードするか、ローカルのバックアップファイルを対象 env に復元します。 |
| [`nb config`](./config/index.md)     | CLI のデフォルト設定を管理します。                                                                          |
| [`nb db`](./db/index.md)             | 選択した env の組み込みデータベースを管理します。                                                           |
| [`nb env`](./env/index.md)           | NocoBase プロジェクト環境、現在の env、状態、詳細、ランタイムコマンドを管理します。                         |
| [`nb license`](./license/index.md)   | 商用ライセンスとライセンス済みプラグインを管理します。                                                      |
| [`nb plugin`](./plugin/index.md)     | 選択した NocoBase env のプラグインを管理します。                                                            |
| [`nb scaffold`](./scaffold/index.md) | NocoBase プラグイン開発用のスキャフォールドを生成します。                                                   |
| [`nb self`](./self/index.md)         | NocoBase CLI 自体を確認または更新します。                                                                   |
| [`nb session`](./session/index.md)   | `NB_SESSION_ID` を設定し、current env をシェルまたは agent runtime ごとに分離します。                       |
| [`nb skills`](./skills/index.md)     | 現在のワークスペースの NocoBase AI coding skills を確認または同期します。                                   |
| [`nb source`](./source/index.md)     | ローカルソースプロジェクトを管理します：ダウンロード、開発、ビルド、テスト。                                |

## コマンド

現在、ルートコマンドから直接公開されている単独コマンド：

| コマンド               | 説明                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| [`nb init`](./init.md) | NocoBase を初期化し、coding agent が接続して作業できるようにします。 |

## ヘルプの表示

ルートコマンドのヘルプを表示する：

```bash
nb --help
```

コマンドまたはコマンドグループのヘルプを表示する：

```bash
nb init --help
nb app --help
nb backup --help
nb config --help
nb api resource --help
nb license --help
```

## 例

対話式初期化：

```bash
nb init
```

ブラウザフォームを使って初期化：

```bash
nb init --ui
```

非対話モードで Docker アプリケーションを作成：

```bash
nb init --env app1 --yes --source docker --version alpha
```

既存のアプリケーションに接続：

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env status
```

アプリ起動後に env 状態を再同期：

```bash
nb app start -e app1
nb env update app1
```

API を呼び出す：

```bash
nb api resource list --resource users -e app1
```

CLI のデフォルト設定を表示：

```bash
nb config list
nb config get docker.network
```

商用ライセンスの状態を表示：

```bash
nb license status -e app1
nb license plugins list -e app1
```

バックアップを作成してダウンロード：

```bash
nb backup create -e app1 --output ./backups
```

ローカルバックアップを復元：

```bash
nb backup restore -e app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## 環境変数

以下の環境変数は CLI の動作に影響します。

| 変数            | 説明                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `NB_CLI_ROOT`   | CLI が `.nocobase` 設定とローカルアプリケーションファイルを保存するルートディレクトリ。デフォルトは現在のユーザーのホームディレクトリです。 |
| `NB_LOCALE`     | CLI のプロンプト言語とローカル初期化 UI の言語。`en-US` と `zh-CN` をサポートします。                                                       |
| `NB_SESSION_ID` | 現在のシェルまたは agent runtime のセッション ID。設定すると、`nb env use` と `nb env current` はセッションごとに分離されます。             |

例：

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## 設定ファイル

デフォルトの設定ファイル：

```text
~/.nocobase/config.json
```

`NB_CLI_ROOT=/your/workspace` を設定すると、設定ファイルのパスは次のようになります。

```text
/your/workspace/.nocobase/config.json
```

CLI は現在の作業ディレクトリ内の旧 project 設定の読み取りにも対応しています。

現在の env のセッションレベルキャッシュは次に保存されます。

```text
.nocobase/sessions/<NB_SESSION_ID>.json
```

グローバルで最後に使用された env は `config.json` の `lastEnv` フィールドに保存されます。`NB_SESSION_ID` がない場合、CLI はこのグローバル値にフォールバックします。

ランタイムコマンドキャッシュは次に保存されます。

```text
.nocobase/versions/<hash>/commands.json
```

このファイルは [`nb env update`](./env/update.md) によって生成または更新され、対象アプリケーションから同期したランタイムコマンドをキャッシュするために使用されます。

## 関連リンク

- [クイックスタート](../../ai/quick-start.mdx)
- [グローバル環境変数](../app/env.md)
- [AI Builder](../../ai-builder/index.md)
- [プラグイン開発](../../plugin-development/index.md)
