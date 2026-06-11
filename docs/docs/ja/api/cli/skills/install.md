---
title: "nb skills install"
description: "nb skills install コマンドリファレンス：グローバルに NocoBase AI coding skills をインストールします。"
keywords: "nb skills install,NocoBase CLI,skills インストール"
---

# nb skills install

グローバルに NocoBase AI coding skills をインストールします。すでにインストール済みの場合、このコマンドはアップデートを実行しません。

## 使い方

```bash
nb skills install [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--yes`, `-y` | boolean | インストールの確認をスキップします |
| `--json` | boolean | JSON で出力します |
| `--verbose` | boolean | 詳細なインストール出力を表示します |

## 使用例

```bash
nb skills install
nb skills install --yes
nb skills install --json
```

## 関連コマンド

- [`nb skills check`](./check.md)
- [`nb skills update`](./update.md)
