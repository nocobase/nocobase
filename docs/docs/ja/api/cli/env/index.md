---
title: "nb env"
description: "nb env コマンドリファレンス：保存済みの NocoBase CLI env を管理します。追加、current env の確認、状態確認、切り替え、更新、認証、削除を含みます。"
keywords: "nb env,NocoBase CLI,環境管理,env,current env,認証,OpenAPI"
---

# nb env

保存済みの NocoBase CLI env を管理します。env には API アドレス、認証情報、ローカルアプリのパス、データベース設定などの接続情報とローカル実行情報が保存されます。

このバージョンから、CLI では 2 つの概念を分けています。

- `current env`：現在のシェルまたはエージェントランタイムが使用している env。可能な場合は `NB_SESSION_ID` によって分離されます
- `last env`：グローバルで最後に使用された env。session mode が有効でない場合のフォールバックとして使われます

## 使い方

```bash
nb env <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb env add`](./add.md) | NocoBase API エンドポイントを保存し、この env に切り替えます |
| [`nb env current`](./current.md) | 現在有効な env を表示します |
| [`nb env update`](./update.md) | 保存済み env の設定を更新し、必要な後続同期を自動で処理します |
| [`nb env list`](./list.md) | 設定済みの env を一覧表示します |
| [`nb env status`](./status.md) | 現在の env、指定した env、またはすべての env の状態を表示します |
| [`nb env info`](./info.md) | 1 つの env の詳細情報を表示します |
| [`nb env remove`](./remove.md) | 管理対象ランタイムを停止したあとで env 設定を削除します |
| [`nb env auth`](./auth.md) | 保存済み env に対して OAuth ログインを実行します |
| [`nb env use`](./use.md) | 現在の env を切り替えます |

## 例

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## session mode

通常は session mode を有効にすることをおすすめします。これにより、異なる端末、異なるシェル、あるいは異なるエージェントランタイムで使われる `current env` が互いに分離され、並行しても影響し合いません。

session mode が有効でない場合、`nb env use` はグローバルな `last env` を更新し、session 分離のないほかのセッションにも影響します。

有効化の方法は [`nb session setup`](../session/setup.md) を参照してください。

## 関連コマンド

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb proxy`](../proxy/index.md)
- [`nb session`](../session/index.md)
