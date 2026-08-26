---
title: "nb scaffold plugin"
description: "nb scaffold plugin コマンドリファレンス：NocoBase プラグインのスキャフォールドを生成します。"
keywords: "nb scaffold plugin,NocoBase CLI,プラグインスキャフォールド"
---

# nb scaffold plugin

NocoBase プラグインのスキャフォールドコードを生成します。

## 使い方

```bash
nb scaffold plugin <pkg> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<pkg>` | string | プラグインのパッケージ名（必須） |
| `--force-recreate`, `-f` | boolean | プラグインスキャフォールドを強制的に再作成します |

## 使用例

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold plugin @nocobase-example/plugin-hello --force-recreate
```

## 関連コマンド

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
