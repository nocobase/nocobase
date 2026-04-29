---
title: "nb skills check"
description: "nb skills check コマンドリファレンス：グローバル NocoBase AI coding skills を確認します。"
keywords: "nb skills check,NocoBase CLI,skills 確認"
---

# nb skills check

グローバル NocoBase AI coding skills を確認し、CLI によって管理されているかどうか、利用可能なアップデートがあるかどうかを報告します。

## 使い方

```bash
nb skills check [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--json` | boolean | JSON で出力します |

## 使用例

```bash
nb skills check
nb skills check --json
```

## 関連コマンド

- [`nb skills install`](./install.md)
- [`nb skills update`](./update.md)
