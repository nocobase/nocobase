---
title: "nb app start"
description: "nb app start コマンドリファレンス：指定した env の NocoBase アプリケーションまたは Docker コンテナを起動します。"
keywords: "nb app start,NocoBase CLI,アプリケーション起動,Docker,pm2"
---

# nb app start

指定した env の NocoBase アプリケーションを起動します。npm/Git インストールではローカルアプリケーションコマンドを実行し、Docker インストールでは保存済みのアプリケーションコンテナを起動します。

## 使い方

```bash
nb app start [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 起動する CLI env 名。省略時は現在の env を使用します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--quickstart` | boolean | アプリケーションをクイックスタートします |
| `--port`, `-p` | string | env 設定の `appPort` をオーバーライドします |
| `--daemon`, `-d` / `--no-daemon` | boolean | デーモンモードで実行するかどうか。デフォルトは有効です |
| `--instances`, `-i` | integer | 実行インスタンス数 |
| `--launch-mode` | string | 起動方式：`pm2` または `node` |
| `--verbose` | boolean | 内部のローカルまたは Docker コマンド出力を表示します |

## 使用例

```bash
nb app start
nb app start --env local
nb app start --env local --quickstart
nb app start --env local --port 12000
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --instances 2
nb app start --env local --launch-mode pm2
nb app start --env local --verbose
nb app start --env local-docker
```

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

## 関連コマンド

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
