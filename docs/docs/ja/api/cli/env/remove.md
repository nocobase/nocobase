---
title: "nb env remove"
description: "nb env remove コマンドリファレンス：指定した NocoBase CLI env の設定を削除します。"
keywords: "nb env remove,NocoBase CLI,環境削除,設定削除"
---

# nb env remove

設定済みの env を削除します。このコマンドは保存済みの CLI env 設定のみを削除し、ローカルのアプリディレクトリ、コンテナ、storage データはクリーンアップしません。ローカル実行リソースを整理する必要がある場合は、[`nb app down`](../app/down.md) を使用してください。

削除した env が現在の env でもある場合、CLI は残っている env から新しい current env を自動で選びます。env が 1 つも残っていない場合、current env はクリアされます。

デフォルトでは、このコマンドは確認を求めます。確認を省略するには `--yes` を指定してください。非対話モードでは、env を削除する前に `--yes` が必須です。

## 使い方

```bash
nb env remove <name> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<name>` | string | 削除する設定済み環境名 |
| `--yes`, `-y` | boolean | 確認をスキップして保存済みの CLI env 設定を削除します |
| `--verbose` | boolean | 詳細な進捗を表示します |

## 使用例

```bash
nb env remove staging
nb env remove staging --yes
```

## 関連コマンド

- [`nb app down`](../app/down.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
