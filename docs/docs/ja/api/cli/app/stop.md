---
title: "nb app stop"
description: "nb app stop コマンドリファレンス：指定した env の NocoBase アプリケーションまたは Docker コンテナを停止します。"
keywords: "nb app stop,NocoBase CLI,アプリケーション停止,Docker"
---

# nb app stop

指定した env の NocoBase アプリケーションを停止します。npm/Git インストールではローカルアプリケーションプロセスを停止し、Docker インストールでは保存済みのアプリケーションコンテナを停止します。

## 使い方

```bash
nb app stop [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 停止する CLI env 名。省略時は現在の env を使用します |
| `--verbose` | boolean | 内部のローカルまたは Docker コマンド出力を表示します |

## 使用例

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

## 関連コマンド

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
