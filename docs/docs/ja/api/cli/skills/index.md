---
title: "nb skills"
description: "nb skills コマンドリファレンス：グローバル NocoBase AI coding skills のチェック、インストール、アップデート、削除を行います。"
keywords: "nb skills,NocoBase CLI,skills,AI coding skills"
---

# nb skills

グローバル NocoBase AI coding skills のチェック、インストール、アップデート、削除を行います。

## 使い方

```bash
nb skills <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb skills check`](./check.md) | グローバル NocoBase AI coding skills を確認します |
| [`nb skills install`](./install.md) | グローバルに NocoBase AI coding skills をインストールします |
| [`nb skills update`](./update.md) | インストール済みの NocoBase AI coding skills をアップデートします |
| [`nb skills remove`](./remove.md) | `nb` が管理する NocoBase AI coding skills を削除します |

## 使用例

```bash
nb skills check
nb skills install --yes
nb skills update --json
nb skills remove --yes
```

## 関連コマンド

- [`nb init`](../init.md)
- [`nb self`](../self/index.md)
