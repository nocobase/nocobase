---
title: "nb self update"
description: "nb self update コマンドリファレンス：npm、pnpm、yarn のグローバルインストールで管理されている NocoBase CLI をアップデートします。"
keywords: "nb self update,NocoBase CLI,アップデート,セルフアップデート"
---

# nb self update

現在の CLI が標準的なグローバル npm、pnpm、または yarn インストールで管理されている場合に、インストール済みの NocoBase CLI をアップデートします。

## 使い方

```bash
nb self update [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--channel` | string | アップデート先のリリース channel。デフォルトは `auto`。選択肢：`auto`、`latest`、`test`、`beta`、`alpha` |
| `--yes`, `-y` | boolean | アップデートの確認をスキップします |
| `--json` | boolean | JSON で出力します |
| `--skills` | boolean | グローバルにインストールされた NocoBase AI coding skills もあわせて更新します |
| `--verbose` | boolean | 詳細なアップデート出力を表示します |

## アップデート動作

`nb self update` は、まず現在のインストール方法を実行時に検出します。以前の `self-install-methods.json` キャッシュは使用しません。

アップデートがある場合、このコマンドは現在のグローバル CLI インストールを管理しているものと同じ package manager を使います。

| インストール方法 | アップデートコマンド |
| --- | --- |
| `npm-global` | `npm install -g @nocobase/cli@<channel>` |
| `pnpm-global` | `pnpm add -g @nocobase/cli@<channel>` |
| `yarn-global` | `yarn global add @nocobase/cli@<channel>` |

対話式確認のデフォルトは yes です。script で prompt をスキップするには `--yes` を使います。

## 使用例

```bash
nb self update
nb self update --yes
nb self update --skills
nb self update --channel alpha --json
```

## 関連コマンド

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
