---
title: "nb app stop"
description: "nb app stop コマンドリファレンス：指定した env の NocoBase アプリケーションを停止し、Docker env ではアプリケーションコンテナを削除します。"
keywords: "nb app stop,NocoBase CLI,アプリケーション停止,Docker"
---

# nb app stop

指定した env の NocoBase アプリケーションを停止します。npm/Git インストールではローカルアプリケーションプロセスを停止し、Docker インストールでは保存済みのアプリケーションコンテナを削除します。

## 使い方

```bash
nb app stop [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 停止する CLI env 名。省略時は現在の env を使用します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--verbose` | boolean | 内部のローカルまたは Docker コマンド出力を表示します |

## 使用例

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

## 関連コマンド

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
