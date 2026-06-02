---
title: "nb env"
description: "nb env コマンドリファレンス：NocoBase CLI env の管理。追加、現在の env の確認、状態確認、切り替え、認証、削除を行います。"
keywords: "nb env,NocoBase CLI,環境管理,env,現在の env,認証,OpenAPI"
---

# nb env

保存済みの NocoBase CLI env を管理します。env には API アドレス、認証情報、ローカルアプリケーションパス、データベース設定、ランタイムコマンドキャッシュが保存されます。

現在のモデルでは、CLI は 2 つの概念を分けています。

- `current env`: アクティブなシェルまたはエージェントランタイムで使用される env。利用可能な場合は `NB_SESSION_ID` で分離されます
- `last env`: グローバルで最後に使用された env。session mode が有効でない場合のフォールバックとして使われます

## 使い方


nb env <command>

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb env add`](./add.md) | NocoBase API エンドポイントを保存し、その env に切り替えます |
| [`nb env current`](./current.md) | 現在有効な env を表示します |
| [`nb env update`](./update.md) | アプリケーションから OpenAPI Schema とランタイムコマンドキャッシュを更新します |
| [`nb env list`](./list.md) | 設定済みの env を一覧表示します |
| [`nb env status`](./status.md) | 現在の env、1 つの env、またはすべての env の状態を表示します |
| [`nb env info`](./info.md) | 単一の env の詳細情報を表示します |
| [`nb env remove`](./remove.md) | 必要に応じて管理対象ランタイムを停止してから env 設定を削除します |
| [`nb env auth`](./auth.md) | 保存済みの env に対して OAuth ログインを実行します |
| [`nb env use`](./use.md) | 現在の env を切り替えます |

## 使用例


nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1

## Session mode

Session mode を既定で推奨します。これにより、異なるターミナル、シェル、エージェントランタイム間で `current env` が分離され、並行作業が互いに影響しにくくなります。

session mode が有効でない場合、`nb env use` はグローバルな `last env` を更新し、分離されていない他のセッションにも影響することがあります。

[`nb session setup`](../session/setup.md) で有効化できます。

## 関連コマンド

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
