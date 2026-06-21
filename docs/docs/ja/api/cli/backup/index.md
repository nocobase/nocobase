---
title: 'nb backup'
description: 'nb backup コマンドリファレンス：NocoBase のバックアップを作成してローカルにダウンロードする、またはローカルのバックアップファイルを対象 env に復元します。'
keywords: 'nb backup,NocoBase CLI,バックアップ,復元,nbdata'
---

# nb backup

NocoBase のバックアップを作成または復元します。`nb backup create` は対象 env でリモートバックアップを作成し、その後バックアップファイルをローカルにダウンロードします。`nb backup restore` はローカルのバックアップファイルを対象 env にアップロードし、アプリケーションが再び利用可能になるまで待機します。

## 使い方

```bash
nb backup <command>
```

## サブコマンド

| コマンド                            | 説明                                                |
| ----------------------------------- | --------------------------------------------------- |
| [`nb backup create`](./create.md)   | バックアップを作成してローカルにダウンロードする    |
| [`nb backup restore`](./restore.md) | ローカルのバックアップファイルを対象 env に復元する |

## 例

```bash
nb backup create
nb backup create --env app1 --output ./backups
nb backup create --env app1 --output ./backups/result.nbdata
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## 説明

実行前に、CLI はまず対象 env がバックアップ関連のランタイムコマンドを公開しているかを確認します。コマンドが不足している場合は、ランタイムキャッシュを自動的に 1 回更新します。更新後も `nb api backup ...` の機能が不足している場合、対象 env で backup/restore 機能がまだ有効化または同期されていないことを意味し、その場合はまず対象アプリケーション自体を処理する必要があります。

具体的には：

- `nb backup create` は `nb api backup create`、`nb api backup status`、`nb api backup download` に依存します
- `nb backup restore` は `nb api backup restore-upload` に依存します

## 関連コマンド

- [`nb env update`](../env/update.md)
- [`nb app restart`](../app/restart.md)
- [`nb api`](../api/index.md)
