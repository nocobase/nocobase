---
title: "nb plugin"
description: "nb plugin コマンドリファレンス：選択した NocoBase env のプラグインを管理します。"
keywords: "nb plugin,NocoBase CLI,プラグイン管理,enable,disable,list"
---

# nb plugin

選択した NocoBase env のプラグインを管理します。npm/Git env ではローカルでプラグインコマンドを実行し、Docker env では保存済みのアプリケーションコンテナ内で実行します。HTTP env では利用可能な場合に API にフォールバックします。

## 使い方

```bash
nb plugin <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb plugin list`](./list.md) | インストール済みプラグインを一覧表示します |
| [`nb plugin enable`](./enable.md) | 1 つまたは複数のプラグインを有効化します |
| [`nb plugin disable`](./disable.md) | 1 つまたは複数のプラグインを無効化します |

## 使用例

```bash
nb plugin list -e local
nb plugin enable @nocobase/plugin-sample
nb plugin disable -e local @nocobase/plugin-sample
```

## 関連コマンド

- [`nb env info`](../env/info.md)
- [`nb scaffold plugin`](../scaffold/plugin.md)
