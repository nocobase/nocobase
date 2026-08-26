---
title: "nb scaffold"
description: "nb scaffold コマンドリファレンス：NocoBase プラグインおよびマイグレーションスクリプトのスキャフォールドを生成します。"
keywords: "nb scaffold,NocoBase CLI,スキャフォールド,プラグイン,migration"
---

# nb scaffold

NocoBase プラグイン開発に関連するスキャフォールドを生成します。

## 使い方

```bash
nb scaffold <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb scaffold plugin`](./plugin.md) | NocoBase プラグインのスキャフォールドを生成します |
| [`nb scaffold migration`](./migration.md) | プラグインのマイグレーションスクリプトを生成します |

## 使用例

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
```

## 関連コマンド

- [`nb plugin`](../plugin/index.md)
- [プラグイン開発](../../../plugin-development/index.md)
