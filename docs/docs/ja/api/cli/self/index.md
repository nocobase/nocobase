---
title: "nb self"
description: "nb self コマンドリファレンス：インストール済みの NocoBase CLI のチェックまたはアップデートを行います。"
keywords: "nb self,NocoBase CLI,セルフアップデート,バージョン確認"
---

# nb self

インストール済みの NocoBase CLI のチェックまたはアップデートを行います。

## 使い方

```bash
nb self <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb self check`](./check.md) | 現在の CLI バージョンとセルフアップデートの対応状況を確認します |
| [`nb self update`](./update.md) | グローバル npm インストールの NocoBase CLI をアップデートします |

## 使用例

```bash
nb self check
nb self check --json
nb self update --yes
```

## 関連コマンド

- [`nb skills`](../skills/index.md)
- [`nb app upgrade`](../app/upgrade.md)
