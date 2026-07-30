---
title: "nb portal"
description: "nb portal コマンドリファレンス: Portal ワークスペースの設定、作成、開発、ソース同期、デプロイ、削除。"
keywords: "nb portal,NocoBase CLI,Portal,workspace,source storage,deploy"
---

# nb portal

`nb portal` は Portal ワークスペースを管理します。Portal は独自のフロントエンドソース、入口パス、デプロイ結果を持つことができ、このコマンドグループは NocoBase の Portal レコードとローカルワークスペース、source storage をつなぎます。

一般的な流れは、ローカルワークスペースを作成し、開発モードを起動し、ソース変更を source storage に push してから build と deploy を行うことです。既存 Portal を引き継ぐ場合は、まず `pull` します。

## 使い方

```bash
nb portal <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb portal config`](./config.md) | ローカル Portal ワークスペースのソース設定を更新し、可能な場合はリモート Portal レコードへ同期します |
| [`nb portal create`](./create.md) | テンプレートからローカル Portal ワークスペースを作成し、Portal レコードを作成または更新します |
| [`nb portal deploy`](./deploy.md) | 指定した Portal ワークスペースをビルドしてデプロイします |
| [`nb portal destroy`](./destroy.md) | Portal レコードとローカルワークスペースを削除します |
| [`nb portal dev`](./dev.md) | 指定した Portal ワークスペースの開発モードを起動します |
| [`nb portal info`](./info.md) | 指定した Portal レコードとローカルワークスペースの詳細を表示します |
| [`nb portal list`](./list.md) | Portal レコードとローカルワークスペースの同期状態を一覧表示します |
| [`nb portal pull`](./pull.md) | source storage から Portal ソースをローカルワークスペースへ取得します |
| [`nb portal push`](./push.md) | ローカルの Portal ソース変更を source storage に push します |

## 典型的な流れ

`customer` という Portal を作成する:

```bash
nb portal create customer -e dev --yes
```

ローカル開発モードを起動する:

```bash
nb portal dev customer -e dev --yes
```

ローカルワークスペースとリモートレコードを確認する:

```bash
nb portal info customer -e dev --yes
nb portal list -e dev --yes
```

ソースを push してデプロイする:

```bash
nb portal push customer -e dev --yes --message "Update customer portal"
nb portal deploy customer -e dev --yes
```

既存 Portal を引き継ぐ:

```bash
nb portal list -e dev --yes
nb portal pull customer -e dev --yes
nb portal dev customer -e dev --yes
```

source storage を切り替える:

```bash
nb portal config customer -e dev --yes --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal push customer -e dev --yes --message "Move customer portal source to Git"
```

## source storage

Portal 作成時に、ソースコードの管理場所を選択できます:

| モード | 説明 |
| --- | --- |
| `nocobase` | Default mode. Source code is managed by NocoBase source storage. |
| `git` | Source code is stored in a Git repository, configured with `--git-repo`, `--git-branch`, and `--git-path`. |

For quick creation and development, the default `nocobase` storage is usually enough. Use `git` when the Portal source should be reviewed, versioned, or built through an existing team workflow.

The Portal name and source configuration are written to `portal.config.json` in the local workspace. `create`, `pull`, and `config` maintain this file; `push` and `deploy` read it to sync source or deployment output.

## Env Types

`nb portal` currently supports `local`, `docker`, and `http` envs:

| モード | 説明 |
| --- | --- |
| `local` | The workspace is independent of app storage. Source and deployment output are synced through APIs. |
| `docker` | The workspace does not depend on a Docker volume. Source and deployment output are synced through APIs. |
| `http` | Source and deployment output are synced through APIs. `pull` downloads a source archive, and `push` uploads one. |

`ssh` envs do not support Portal management in the current version.

## Local Workspace Path

`create` defaults to a portal-named child of the current directory. The first `pull` uses the same location; if the current directory already contains `portal.config.json`, `pull` uses the current directory directly:

```text
<current-directory>/<portal>
```

`dev`, `push`, `deploy`, `config`, `destroy`, `info`, and `list` use the current directory as the local Portal workspace by default. Pass `--dir <path>` to any of these commands to select a workspace explicitly; relative paths are resolved from the current directory. The CLI does not derive the local workspace from the env `storagePath`.

The main app access path is usually:

```text
<appPublicPath>/x/<portal>/
```

A sub-app access path is usually:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

## Env Confirmation

Most `nb portal` subcommands support `--env` and `--yes`:

| パラメーター | 説明 |
| --- | --- |
| `--env`, `-e` | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | Skip cross-env confirmation when an explicit `--env` targets a different env from the current env. |

In scripts or AI agent workflows, pass `--env` and `--yes` explicitly to avoid stopping at an interactive confirmation.

## 関連コマンド

- [`nb env`](../env/index.md)
- [`nb app`](../app/index.md)
- [`nb source`](../source/index.md)
