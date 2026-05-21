---
title: "nb config"
description: "nb config コマンドリファレンス：CLI のデフォルト設定を管理します。"
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

CLI のデフォルト設定を管理します。現在サポートされているキー：

- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`

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
nb config get docker.network
nb config set docker.network nocobase
nb config delete docker.container-prefix
```

## 関連コマンド

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
