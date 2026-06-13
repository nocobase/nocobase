---
title: "nb skills update"
description: "nb skills update コマンドリファレンス：グローバル NocoBase AI coding skills をアップデートします。"
keywords: "nb skills update,NocoBase CLI,skills アップデート"
---

# nb skills update

グローバルにインストール済みの NocoBase AI coding skills をアップデートします。このコマンドは既存の `@nocobase/skills` インストールのみを更新します。

## 使い方

```bash
nb skills update [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--yes`, `-y` | boolean | アップデートの確認をスキップします |
| `--json` | boolean | JSON で出力します |
| `--verbose` | boolean | 詳細なアップデート出力を表示します |

## 使用例

```bash
nb skills update
nb skills update --yes
nb skills update --json
```

## 関連コマンド

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
