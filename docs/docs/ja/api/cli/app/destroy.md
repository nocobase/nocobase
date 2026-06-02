---
title: "nb app destroy"
description: "nb app destroy コマンドリファレンス：選択した env の管理対象ランタイムリソース、storage データ、保存済み env 設定を削除します。"
keywords: "nb app destroy,NocoBase CLI,env 削除,クリーンアップ,storage 削除"
---

# nb app destroy

選択した env を破棄し、管理対象ランタイムリソース、storage データ、保存済みの CLI env 設定を削除します。

local/Docker env では、このコマンドはまずこのマシン上で管理されているアプリのランタイムリソースを削除し、内蔵データベースのランタイムが存在する場合はそれも削除し、storage データを削除したうえで保存済みの CLI env 設定を削除します。HTTP/SSH env では、保存済みの CLI env 設定だけを削除し、外部サービスには触れません。

ダウンロード型のローカル npm/Git env では、CLI が管理しているローカル app ファイルも削除します。カスタムのローカル app パスでは、ローカルのソースファイルは保持され、管理対象ランタイムリソース、storage データ、保存済み env 設定だけが削除されます。

デフォルトでは、このコマンドは確認を求めます。非対話モードでは、`--env` と `--force` の明示的な指定が必要です。

## 使い方

```bash
nb app destroy [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 破棄する CLI env 名。対話モードでは省略時に current env がデフォルトで使われます |
| `--force`, `-f` | boolean | 確認をスキップして選択した env をすぐに破棄します。非対話モードでは必須です |
| `--verbose` | boolean | destroy コマンドの生の出力を表示します |

## 使用例

```bash
nb app destroy --env app1
nb app destroy --env app1 --force
```

## 関連コマンド

- [`nb app stop`](./stop.md)
- [`nb app down`](./down.md)
- [`nb env remove`](../env/remove.md)
