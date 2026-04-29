---
title: "nb plugin list"
description: "nb plugin list コマンドリファレンス：選択した NocoBase env のプラグインを一覧表示します。"
keywords: "nb plugin list,NocoBase CLI,プラグイン一覧"
---

# nb plugin list

選択した env のインストール済みプラグインを一覧表示します。

## 使い方

```bash
nb plugin list [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名。省略時は現在の env を使用します |

## 使用例

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local-docker
```

## 関連コマンド

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
