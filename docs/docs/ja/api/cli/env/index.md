---
title: "nb env"
description: "nb env コマンドリファレンス：NocoBase CLI env の管理。追加、更新、表示、切り替え、認証、削除を行います。"
keywords: "nb env,NocoBase CLI,環境管理,env,認証,OpenAPI"
---

# nb env

保存済みの NocoBase CLI env を管理します。env には API アドレス、認証情報、ローカルアプリケーションパス、データベース設定、ランタイムコマンドキャッシュが保存されます。

## 使い方

```bash
nb env <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb env add`](./add.md) | NocoBase API エンドポイントを保存し、現在の env に切り替えます |
| [`nb env update`](./update.md) | アプリケーションから OpenAPI Schema とランタイムコマンドキャッシュを更新します |
| [`nb env list`](./list.md) | 設定済みの env と API 認証状態を一覧表示します |
| [`nb env info`](./info.md) | 単一の env の詳細情報を表示します |
| [`nb env remove`](./remove.md) | env 設定を削除します |
| [`nb env auth`](./auth.md) | 保存済みの env に対して OAuth ログインを実行します |
| [`nb env use`](./use.md) | 現在の env を切り替えます |

## 使用例

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env list
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## 関連コマンド

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
