---
title: "nb app autostart list"
description: "nb app autostart list のリファレンス：設定済みのすべての env について自動起動状態を一覧表示します。"
keywords: "nb app autostart list,NocoBase CLI,autostart,env list"
---

# nb app autostart list

設定済みのすべての env について自動起動状態を一覧表示します。

出力テーブルには次の列が含まれます。

- `Current`: 現在の env を `*` で表示
- `Env`: env 名
- `Kind`: env の種類
- `Source`: インストールまたはソースの種類
- `Autostart`: 自動起動が有効かどうか

## 使用方法

```bash
nb app autostart list
```

## 例

```bash
nb app autostart list
```

## 注意

まだ保存済み env が 1 つもない場合、このコマンドは `No environments are configured.` を出力します。

このコマンドは保存されている CLI 状態だけを表示します。アプリが現在起動しているかどうかや、OS の起動フローがすでに `nb app autostart run` を呼び出しているかどうかは確認しません。主な目的は、CLI 設定の中でどの env が自動起動対象としてマークされているかを確認することです。

## 関連コマンド

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart disable`](./disable.md)
- [`nb env list`](../../env/list.md)
