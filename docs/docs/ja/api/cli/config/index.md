---
title: "nb config"
description: "nb config コマンドリファレンス：NocoBase CLI のデフォルト設定項目を管理します。"
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

CLI のデフォルト設定を管理します。現在サポートされている設定キー：

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## よく使う設定キー

| キー | デフォルト値 | 説明 |
| --- | --- | --- |
| `locale` | 現在の CLI ロケール解決ルール | CLI の表示言語を上書きします |
| `update.policy` | `prompt` | 起動時の更新動作です。`prompt`、`auto`、`off` を指定できます |
| `license.pkg-url` | `https://pkg.nocobase.com/` | 商用パッケージで使うパッケージレジストリです |
| `docker.network` | `nocobase` | CLI が管理する Docker アプリで使うデフォルトネットワークです |
| `docker.container-prefix` | `nb` | CLI が管理する Docker コンテナで使うデフォルト接頭辞です |
| `bin.docker` | `docker` | Docker 実行ファイルのパスを上書きします |
| `bin.git` | `git` | Git 実行ファイルのパスを上書きします |
| `bin.yarn` | `yarn` | Yarn 実行ファイルのパスを上書きします |

## 使い方

```bash
nb config <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb config get`](./get.md) | 設定キーの有効値を取得します |
| [`nb config set`](./set.md) | 設定値を設定します |
| [`nb config delete`](./delete.md) | 明示的に設定された値を削除します |
| [`nb config list`](./list.md) | 明示的に設定された値を一覧表示します |

## 使用例

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## 関連コマンド

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
