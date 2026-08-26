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
| `--channel` | string | 比較対象のリリース channel。デフォルトは `auto`。選択肢：`auto`、`latest`、`beta`、`alpha` |
| `--json` | boolean | JSON で出力します |

## 使用例

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## 関連コマンド

- [`nb self update`](./update.md)
