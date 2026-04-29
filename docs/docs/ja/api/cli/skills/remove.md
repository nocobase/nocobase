---
title: "nb skills remove"
description: "nb skills remove コマンドリファレンス：グローバル NocoBase AI coding skills を削除します。"
keywords: "nb skills remove,NocoBase CLI,skills 削除"
---

# nb skills remove

`nb` が管理するグローバル NocoBase AI coding skills を削除します。

## 使い方

```bash
nb skills remove [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--yes`, `-y` | boolean | 削除の確認をスキップします |
| `--json` | boolean | JSON で出力します |
| `--verbose` | boolean | 詳細な削除出力を表示します |

## 使用例

```bash
nb skills remove
nb skills remove --yes
nb skills remove --json
```

## 関連コマンド

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
