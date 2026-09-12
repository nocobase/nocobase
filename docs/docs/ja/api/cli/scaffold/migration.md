---
title: "nb scaffold migration"
description: "nb scaffold migration コマンドリファレンス：NocoBase プラグインのマイグレーションスクリプトを生成します。"
keywords: "nb scaffold migration,NocoBase CLI,マイグレーションスクリプト,migration"
---

# nb scaffold migration

プラグインのマイグレーションスクリプトファイルを生成します。

## 使い方

```bash
nb scaffold migration <name> --pkg <pkg> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<name>` | string | マイグレーションスクリプト名（必須） |
| `--pkg` | string | 所属するプラグインのパッケージ名（必須） |
| `--on` | string | 実行タイミング：`beforeLoad`、`afterSync`、または `afterLoad` |

## 使用例

```bash
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
nb scaffold migration migration-name --pkg @nocobase/plugin-acl --on afterLoad
```

## 関連コマンド

- [`nb scaffold plugin`](./plugin.md)
- [プラグイン開発](../../../plugin-development/index.md)
