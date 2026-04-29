---
title: "nb self update"
description: "nb self update コマンドリファレンス：グローバル npm インストールの NocoBase CLI をアップデートします。"
keywords: "nb self update,NocoBase CLI,アップデート,セルフアップデート"
---

# nb self update

現在の CLI が標準的なグローバル npm インストールで管理されている場合に、インストール済みの NocoBase CLI をアップデートします。

## 使い方

```bash
nb self update [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--channel` | string | アップデート先のリリース channel。デフォルトは `auto`。選択肢：`auto`、`latest`、`beta`、`alpha` |
| `--yes`, `-y` | boolean | アップデートの確認をスキップします |
| `--json` | boolean | JSON で出力します |
| `--verbose` | boolean | 詳細なアップデート出力を表示します |

## 使用例

```bash
nb self update
nb self update --yes
nb self update --channel alpha --json
```

## 関連コマンド

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
