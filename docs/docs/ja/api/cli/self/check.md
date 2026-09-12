---
title: "nb self check"
description: "nb self check コマンドリファレンス：インストール済み NocoBase CLI のバージョンとセルフアップデートの対応状況を確認します。"
keywords: "nb self check,NocoBase CLI,バージョン確認"
---

# nb self check

現在の NocoBase CLI のインストールを確認し、選択した channel の最新バージョンを解決し、自動セルフアップデートに対応しているかどうかを報告します。

## 使い方

```bash
nb self check [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--channel` | string | 比較対象のリリース channel。デフォルトは `auto`。選択肢：`auto`、`latest`、`test`、`beta`、`alpha` |
| `--json` | boolean | JSON で出力します |

## インストール方法

`nb self check` は現在のインストール方法を実行時に検出します。以前の `self-install-methods.json` キャッシュは使用しません。

このコマンドは、次のインストール方法を表示できます。

| インストール方法 | 意味 |
| --- | --- |
| `npm-global` | CLI が現在の `npm prefix -g` 配下にインストールされています。 |
| `pnpm-global` | CLI が pnpm のグローバル `node_modules` ツリー配下にインストールされています。 |
| `yarn-global` | CLI が `yarn global bin` から起動されているか、`yarn global dir` 配下にインストールされています。 |
| `package-local` | CLI がローカルプロジェクトの依存関係ツリーにインストールされています。 |
| `source` | CLI がリポジトリの checkout から実行されています。 |
| `unknown` | CLI のインストールをサポート対象のインストール方法に一致させられませんでした。 |

セルフアップデートは `npm-global`、`pnpm-global`、`yarn-global` でサポートされます。`package-local` または `source` の場合は、親プロジェクトまたはリポジトリ checkout を更新してください。

## 使用例

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## 関連コマンド

- [`nb self update`](./update.md)
