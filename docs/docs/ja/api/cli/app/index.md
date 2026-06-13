---
title: 'nb app'
description: 'nb app コマンドリファレンス：起動、停止、再起動、ログ、アップグレードを含む NocoBase アプリケーションのランタイムを管理します。'
keywords: 'nb app,NocoBase CLI,起動,停止,再起動,ログ,アップグレード'
---

# nb app

NocoBase アプリケーションのランタイムを管理します。npm/Git env ではローカルのソースコードディレクトリでアプリケーションコマンドを実行し、Docker env では保存済み設定に基づいてアプリケーションコンテナを管理します。

## 使用方法

```bash
nb app <command>
```

## サブコマンド

| コマンド                         | 説明                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------ |
| [`nb app start`](./start.md)     | アプリケーションを起動する、または Docker コンテナを再作成する                 |
| [`nb app stop`](./stop.md)       | アプリケーションを停止する、または Docker コンテナをクリーンアップする         |
| [`nb app restart`](./restart.md) | まず停止してからアプリケーションを起動する                                     |
| [`nb app autostart`](./autostart/index.md) | 自動起動マークを管理し、有効な env をまとめて起動する |
| [`nb app logs`](./logs.md)       | アプリケーションログを表示する                                                 |
| [`nb app upgrade`](./upgrade.md) | アプリケーションを停止し、ソースコードまたはイメージを置き換えてから再起動する |

## 例

```bash
nb app start --env app1
nb app restart --env app1
nb app autostart enable --env app1 --yes
nb app autostart run
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app stop --env app1 --with-db
```

## 関連コマンド

- [`nb env info`](../env/info.md)
- [`nb env remove`](../env/remove.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
