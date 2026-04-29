---
title: "nb app"
description: "nb app コマンドリファレンス：NocoBase アプリケーションのランタイム管理。起動、停止、再起動、ログ、クリーンアップ、アップグレードを行います。"
keywords: "nb app,NocoBase CLI,起動,停止,再起動,ログ,アップグレード"
---

# nb app

NocoBase アプリケーションのランタイムを管理します。npm/Git env ではローカルソースディレクトリでアプリケーションコマンドを実行し、Docker env では保存済みのアプリケーションコンテナを管理します。

## 使い方

```bash
nb app <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb app start`](./start.md) | アプリケーションまたは Docker コンテナを起動します |
| [`nb app stop`](./stop.md) | アプリケーションまたは Docker コンテナを停止します |
| [`nb app restart`](./restart.md) | アプリケーションを停止してから再起動します |
| [`nb app logs`](./logs.md) | アプリケーションのログを表示します |
| [`nb app down`](./down.md) | ローカル実行リソースを停止してクリーンアップします |
| [`nb app upgrade`](./upgrade.md) | ソースコードまたはイメージを更新し、アプリケーションを再起動します |

## 使用例

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 -s
nb app down --env app1 --all --yes
```

## 関連コマンド

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
