---
title: 'nb backup restore'
description: 'nb backup restore コマンドリファレンス: ローカルのバックアップファイルを対象の env に復元します。'
keywords: 'nb backup restore,NocoBase CLI,バックアップを復元,復元,nbdata'
---

# nb backup restore

ローカルのバックアップファイルを対象の env に復元します。通常、ここでは `*.nbdata` ファイルを使用します。復元すると対象アプリケーションのデータが上書きされるため、CLI はデフォルトで再度確認を行います。

## 使い方

```bash
nb backup restore --file <path> [flags]
```

## パラメータ

| パラメータ     | 型      | 説明                                                                                         |
| -------------- | ------- | -------------------------------------------------------------------------------------------- |
| `--env`, `-e`  | string  | 復元先の CLI env 名。省略時は現在の env を使用                                               |
| `--yes`, `-y`  | boolean | `--env` で明示指定した env が現在の env と異なる場合に、対話確認をスキップ                   |
| `--file`, `-f` | string  | ローカルのバックアップファイルのパス。必須                                                   |
| `--force`      | boolean | アプリケーションデータの上書きを確認。非対話端末および AI agent セッションでは明示指定が必須 |

## 例

```bash
nb backup restore --file ./backups/base.nbdata --force
nb backup restore --env e2e --file ./backups/base.nbdata --yes --force
```

## 説明

CLI が `--env` と現在の env が一致しているかを確認するのは、`--env` を明示的に渡した場合のみです。異なる env を明示指定した場合、対話端末では先に確認が行われます。非対話端末や AI agent のシナリオでは、自分で明示的に `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行する必要があります。

実行前に、CLI はまず `--file` が指すパスが存在するかを確認し、それが通常ファイルであることを確認します。パスが存在しない場合やディレクトリを指している場合、コマンドは直ちに失敗します。

`--force` を指定しない場合、対話端末では今回の復元がアプリケーションデータを上書きすることを明示する確認がもう一度表示されます。非対話端末および AI agent セッションでは、`--force` がないと CLI は実行を直接拒否し、そのままコピーして再実行できる案内を表示します。さらに env をまたぐ操作でもある場合は、通常 `--yes` と `--force` の両方を指定する必要があります。

アップロード成功後、CLI は対象アプリケーションが再び `__health_check` を通過するまで待機し続けます。つまり、コマンドが正常に返る時点では、通常アプリケーションはすでにアクセス可能な状態に復元されています。

## 関連コマンド

- [`nb backup create`](./create.md)
- [`nb app restart`](../app/restart.md)
