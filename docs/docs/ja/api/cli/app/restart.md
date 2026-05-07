---
title: "nb app restart"
description: "nb app restart コマンドリファレンス：指定した env の NocoBase アプリケーションまたは Docker コンテナを再起動します。"
keywords: "nb app restart,NocoBase CLI,アプリケーション再起動,Docker"
---

# nb app restart

指定した env の NocoBase アプリケーションを停止してから再起動します。

## 使い方

```bash
nb app restart [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 再起動する CLI env 名。省略時は現在の env を使用します |
| `--quickstart` | boolean | 停止後にアプリケーションをクイックスタートします |
| `--port`, `-p` | string | env 設定の `appPort` をオーバーライドします |
| `--daemon`, `-d` / `--no-daemon` | boolean | 停止後にデーモンモードで実行するかどうか。デフォルトは有効です |
| `--instances`, `-i` | integer | 停止後の実行インスタンス数 |
| `--launch-mode` | string | 起動方式：`pm2` または `node` |
| `--verbose` | boolean | 内部の停止・起動コマンド出力を表示します |

## 使用例

```bash
nb app restart
nb app restart --env local
nb app restart --env local --quickstart
nb app restart --env local --port 12000
nb app restart --env local --no-daemon
nb app restart --env local --instances 2
nb app restart --env local --launch-mode pm2
nb app restart --env local-docker
```

## 関連コマンド

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
