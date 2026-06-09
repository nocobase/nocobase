---
title: 'nb env remove'
description: 'nb env remove コマンドリファレンス：env 設定を削除する前に管理対象ランタイムを停止する、または必要に応じてローカルの管理対象リソースを完全にクリーンアップします。'
keywords: 'nb env remove,NocoBase CLI,環境を削除,設定を削除,purge'
---

# nb env remove

設定済みの env を削除します。local/docker env の場合、このコマンドはまず現在のマシン上で CLI によって管理されているアプリケーションランタイムと組み込みデータベースランタイムを停止し、その後保存済みの CLI env 設定を削除します。http/ssh env の場合、このコマンドは保存済みの CLI env 設定のみを削除します。

削除された env が現在の env である場合、CLI は残っている env の中から新しい current env を自動的に選択します。使用可能な env がもうない場合、current env はクリアされます。

デフォルトでは、このコマンドは確認を求めます。非対話モードでは、実行するには `--force` を明示的に指定する必要があります。

現在のマシン上の CLI 管理対象リソースを可能な限りクリーンアップしたい場合は、`--purge` を指定します。local/docker env では、`--purge` により管理対象ランタイムリソース、storage データ、および該当する場合はダウンロード型のローカル app ファイルもあわせてクリーンアップされます。http/ssh env では、`--purge` は外部サービスには影響せず、保存済みの CLI env 設定のみを削除します。

## 使い方

```bash
nb env remove <name> [flags]
```

## パラメータ

| パラメータ      | 型      | 説明                                                                                                                                                                                                       |
| --------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<name>`        | string  | 削除する設定済み環境の名前                                                                                                                                                                                 |
| `--force`, `-f` | boolean | 現在の remove モードでの確認をスキップします。非対話モードでは必須です                                                                                                                                     |
| `--purge`       | boolean | 現在のマシン上の CLI 管理対象リソース、storage データ、および該当する場合はダウンロード型のローカル app ファイルを追加でクリーンアップします。remote API env の場合は、保存済みの env 設定のみを削除します |
| `--verbose`     | boolean | 詳細な進行状況を表示します                                                                                                                                                                                 |

## 例

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## 関連コマンド

- [`nb app stop`](../app/stop.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
