---
title: "nb scaffold plugin"
description: "nb scaffold plugin コマンドリファレンス：NocoBase プラグインのスキャフォールドを生成します。"
keywords: "nb scaffold plugin,NocoBase CLI,プラグインスキャフォールド"
---

# nb scaffold plugin

NocoBase プラグインのスキャフォールドコードを生成します。

## 使い方

```bash
nb scaffold plugin <pkg> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<pkg>` | string | プラグインのパッケージ名（必須） |
| `--cwd`, `-c` | string | アプリケーションルートディレクトリのパスを指定します |
| `--force-recreate`, `-f` | boolean | プラグインスキャフォールドを強制的に再作成します |

## 使用例

```bash
nb scaffold plugin @my-project/plugin-hello
nb scaffold plugin @my-project/plugin-hello --cwd /path/to/app
nb scaffold plugin @my-project/plugin-hello --force-recreate
```

## 説明

CLI が管理する source app（`nb init` で作成したアプリケーション）の場合、プラグインは `<app-path>/plugins/` ディレクトリに生成されます。`nb` が自動的にプラグインを `source/packages/plugins/` に同期するため、開発やビルドのプロセスで利用できます。

対象のプラグインが既に存在する場合、コマンドはデフォルトでエラーを返します。`--force-recreate` を使用すると強制的に再作成できます。source 側に競合するディレクトリや外部シンボリックリンクがある場合は、競合を手動で削除してから再試行してください。

## 関連コマンド

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
