---
title: "nb plugin enable"
description: "nb plugin enable コマンドリファレンス：選択した NocoBase env で 1 つまたは複数のプラグインを有効化します。"
keywords: "nb plugin enable,NocoBase CLI,プラグイン有効化"
---

# nb plugin enable

選択した env で 1 つまたは複数のプラグインを有効化します。

## 使い方

```bash
nb plugin enable <packages...> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<packages...>` | string[] | プラグインのパッケージ名（必須）。複数指定できます |
| `--env`, `-e` | string | CLI env 名。省略時は現在の env を使用します |

## 使用例

```bash
nb plugin enable @nocobase/plugin-sample
nb plugin enable @nocobase/plugin-a @nocobase/plugin-b
nb plugin enable -e local @nocobase/plugin-sample
```

## 関連コマンド

- [`nb plugin list`](./list.md)
- [`nb plugin disable`](./disable.md)
