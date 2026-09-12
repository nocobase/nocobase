---
title: "nb app restart"
description: "nb app restart コマンドリファレンス：指定した env の NocoBase アプリケーションを再起動します。必要に応じて、CLI はまず現在のライセンスで利用が許可されている商用プラグインを同期し、その後ローカル env では再起動前に必要なインストールまたはアップグレード準備を自動実行し、Docker env では保存済み設定からアプリケーションコンテナを再作成します。"
keywords: "nb app restart,NocoBase CLI,アプリケーション再起動,Docker"
---

# nb app restart

指定した env の NocoBase アプリケーションを停止してから再起動します。必要に応じて、CLI はまず現在のライセンスで利用が許可されている商用プラグインを同期します。その後、ローカル env は `nb app stop` と `nb app start` のフローを再利用し、デフォルトで再起動前に必要なインストールまたはアップグレード準備を自動実行します。Docker env は現在のコンテナを先に削除し、保存済みの env 設定からアプリケーションコンテナを再作成します。

## 使い方

```bash
nb app restart [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 再起動する CLI env 名。省略時は現在の env を使用します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--verbose` | boolean | 内部の停止および起動コマンド出力を表示します |

## 使用例

```bash
nb app restart
nb app restart --env local
nb app restart --env local --verbose
nb app restart --env local-docker
```

## 説明

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

デフォルトでは、必要に応じて CLI はまず `nb license plugins sync --skip-if-no-license` を実行し、現在のライセンスで利用が許可されている商用プラグインを同期します。その後、ローカル env は再起動前に必要なインストールまたはアップグレード準備を自動実行し、Docker env はコンテナ再作成前にその手順を完了します。CLI がアプリケーションの準備完了を待つ必要がある場合は、`__health_check` を確認します。最初に待機メッセージを 1 行出力し、その後は 10 秒ごとに進捗メッセージを 1 行ずつ出力し、アプリケーションが利用可能になるかタイムアウトするまで待機します。

## hook スクリプト

現在の env が `nb init --hook-script` で hook を保存している場合、`nb app restart` はアプリが再起動し、`__health_check` に通った後で `afterAppStart(context)` を 1 回実行します。`context.phase = 'app-start'`、`context.command = 'app:restart'` になります。

## 関連コマンド

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
