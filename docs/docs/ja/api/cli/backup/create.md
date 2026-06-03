---
title: 'nb backup create'
description: 'nb backup create コマンドリファレンス：選択した env を通じてバックアップを作成し、バックアップファイルをローカルにダウンロードします。'
keywords: 'nb backup create,NocoBase CLI,バックアップを作成,バックアップをダウンロード,nbdata'
---

# nb backup create

選択した env を通じてバックアップを作成し、バックアップファイルをローカルにダウンロードします。`--output` を省略すると、CLI はファイルを現在の作業ディレクトリに保存し、リモートから返されたバックアップファイル名（通常は `backup_*.nbdata`）をそのまま使用します。

## 使い方

```bash
nb backup create [flags]
```

## パラメータ

| パラメータ            | 型      | 説明                                                                                                                                   |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e`         | string  | バックアップを作成する CLI env の名前。省略時は現在の env を使用                                                                       |
| `--yes`, `-y`         | boolean | `--env` で明示的に指定した env が現在の env と一致しない場合に、対話確認をスキップ                                                     |
| `--output`, `-o`      | string  | ダウンロード先パス。省略時は現在のディレクトリに保存。既存ディレクトリを指す場合は、リモートのバックアップファイル名が自動で付加される |
| `--json-output`, `-j` | boolean | 最終結果を JSON で出力。フィールドには `env`、`name`、`output` が含まれる                                                              |

## 例

```bash
nb backup create
nb backup create --output ./backups
nb backup create --output ./backups/base.nbdata
nb backup create --env e2e --output ./backups --yes
nb backup create --env e2e --json-output
```

## 説明

CLI が `--env` が現在の env と一致するかを確認するのは、`--env` を明示的に渡した場合だけです。異なる env を明示的に指定した場合、対話型ターミナルでは先に確認が求められます。非対話型ターミナルや AI agent のシナリオでは、自分で明示的に `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行する必要があります。

作成フローは 2 段階に分かれています。まず対象 env の backup API を呼び出してリモートバックアップを作成し、その後 2 秒ごとに状態をポーリングします。バックアップ完了後、ファイルをローカルにダウンロードします。600 秒経ってもリモートが `inProgress: true` を返し続ける場合、コマンドはタイムアウトして終了します。

`--output` にはファイルパスまたは既存のディレクトリパスを指定できます。CLI は既存のパスだけをディレクトリとして認識し、パスが存在しない場合は保存先ファイルパスとして扱います。

`--json-output` を渡すと、CLI は進捗テキストを出力せず、最終的な JSON 結果を直接出力します。このモードは、スクリプトや agent のワークフローで続けて利用するのに適しています。

## 関連コマンド

- [`nb backup restore`](./restore.md)
- [`nb env update`](../env/update.md)
