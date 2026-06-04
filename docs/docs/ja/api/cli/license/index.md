---
title: "nb license"
description: "nb license コマンドリファレンス：NocoBase の商用ライセンスとライセンス済みプラグインを管理します。"
keywords: "nb license,NocoBase CLI,commercial licensing"
---

# nb license

NocoBase の商用ライセンスを管理します。既存の license key を使った有効化、Instance ID、ライセンス状態、ライセンス済みプラグインが含まれます。

## 使い方

```bash
nb license <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb license activate`](./activate.md) | 既存の license key を使って現在の env の商用ライセンスを有効化します |
| [`nb license id`](./id.md) | 現在の env の instance ID を表示または生成します |
| [`nb license status`](./status.md) | 現在の env の商用ライセンス状態を表示します |
| [`nb license plugins`](./plugins/index.md) | 現在のライセンスで許可された商用プラグインを管理します |

## 使用例

```bash
nb license id --env app1
nb license activate --env app1 --key-file ./license.txt
nb license status --env app1
nb license plugins list --env app1
nb license plugins sync --env app1
```

## 関連コマンド

- [`nb config`](../config/index.md)
- [`nb plugin`](../plugin/index.md)
- [`nb db check`](../db/check.md)
