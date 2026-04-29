---
title: "nb env remove"
description: "nb env remove コマンドリファレンス：指定した NocoBase CLI env の設定を削除します。"
keywords: "nb env remove,NocoBase CLI,環境削除,設定削除"
---

# nb env remove

設定済みの env を削除します。このコマンドは CLI の env 設定のみを削除します。ローカルアプリケーション、コンテナ、storage のクリーンアップが必要な場合は、[`nb app down`](../app/down.md) を使用してください。

## 使い方

```bash
nb env remove <name> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<name>` | string | 削除する環境名 |
| `--force`, `-f` | boolean | 確認をスキップして直接削除します |
| `--verbose` | boolean | 詳細な進捗を表示します |

## 使用例

```bash
nb env remove staging
nb env remove staging -f
```

## 関連コマンド

- [`nb app down`](../app/down.md)
- [`nb env list`](./list.md)
