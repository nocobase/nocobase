---
title: "nb env remove"
description: "nb env remove コマンドリファレンス：管理対象ランタイムを停止してから env 設定を削除するか、必要に応じてローカル CLI リソースを完全に整理します。"
keywords: "nb env remove,NocoBase CLI,環境削除,設定削除,purge"
---

# nb env remove

設定済みの env を削除します。local/Docker env では、このコマンドはまずこのマシン上で CLI が管理しているアプリ実行環境と内蔵データベース実行環境を停止し、その後に保存済みの CLI env 設定を削除します。HTTP/SSH env では、保存済みの CLI env 設定だけを削除します。

削除した env が現在の env でもある場合、CLI は残っている env から新しい current env を自動で選びます。env が 1 つも残っていない場合、current env はクリアされます。

デフォルトでは、このコマンドは確認を求めます。非対話モードでは、実行前に `--force` が必須です。

`--purge` を指定すると、このマシン上の CLI 管理リソースもあわせて整理します。local/Docker env では、`--purge` は [`nb app destroy`](../app/destroy.md) と同等のクリーンアップを行います。HTTP/SSH env では、外部サービスには触れず、保存済みの CLI env 設定だけを削除します。

## 使い方

```bash
nb env remove <name> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<name>` | string | 削除する設定済み環境名 |
| `--force`, `-f` | boolean | 選択した remove モードの確認をスキップします。非対話モードでは必須です |
| `--purge` | boolean | CLI が管理するローカル実行リソース、storage データ、必要に応じてダウンロード済みのローカル app ファイルも削除します。remote API env では保存済みの env 設定だけを削除します |
| `--verbose` | boolean | 詳細な進捗を表示します |

## 使用例

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## 関連コマンド

- [`nb app stop`](../app/stop.md)
- [`nb app destroy`](../app/destroy.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
