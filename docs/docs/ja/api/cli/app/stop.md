---
title: 'nb app stop'
description: 'nb app stop コマンドリファレンス: 指定した env の NocoBase アプリケーションを停止し、必要に応じて CLI 管理の組み込みデータベースコンテナもあわせてクリーンアップします。'
keywords: 'nb app stop,NocoBase CLI,アプリケーション停止,Docker,with-db,組み込みデータベース'
---

# nb app stop

指定した env の NocoBase アプリケーションを停止します。npm/Git インストールではローカルのアプリケーションプロセスを停止し、Docker インストールでは保存済みのアプリケーションコンテナをクリーンアップします。

`--with-db` を指定し、この env が CLI 管理の組み込みデータベースを使用している場合、コマンドはデータベースコンテナもあわせてクリーンアップします。この env が外部データベースを使用している場合、データベースリソースには触れません。

## 使い方

```bash
nb app stop [flags]
```

## パラメータ

| パラメータ    | 型      | 説明                                                                                       |
| ------------- | ------- | ------------------------------------------------------------------------------------------ |
| `--env`, `-e` | string  | 停止する CLI env の名前。省略時は現在の env を使用                                         |
| `--yes`, `-y` | boolean | `--env` で明示的に指定した env が現在の env と異なる場合、対話確認をスキップ               |
| `--with-db`   | boolean | CLI 管理の組み込みデータベースが存在する場合、データベースコンテナもあわせてクリーンアップ |
| `--verbose`   | boolean | 基盤となるローカルまたは Docker コマンドの出力を表示                                       |

## 例

```bash
nb app stop
nb app stop --env local
nb app stop --env local --with-db
nb app stop --env local --verbose
nb app stop --env local-docker
```

## 説明

CLI が指定された env と現在の env が一致するかを確認するのは、`--env` を明示的に渡した場合だけです。異なる env を明示的に指定すると、対話端末では最初に確認が行われます。非対話端末または AI エージェントのシナリオでは、自分で明示的に `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行する必要があります。

`--with-db` は CLI 管理の組み込みデータベースコンテナにのみ影響します。通常、アプリケーション自体だけを停止したい場合はこのパラメータは不要です。現在のマシン上の組み込みデータベース実行環境も一緒に停止したい場合にのみ追加してください。

このコマンドは、現在のマシン上の local または Docker ランタイムにしか操作できません。ある env が単なる HTTP API 接続である場合や、予約中の SSH env である場合、`nb app stop` でリモート停止を代行することはできません。

## 関連コマンド

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb env remove`](../env/remove.md)
