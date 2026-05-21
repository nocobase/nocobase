---
title: "nb env list"
description: "nb env list コマンドリファレンス：設定済みの NocoBase CLI env を一覧表示します。"
keywords: "nb env list,NocoBase CLI,環境一覧,API Base URL"
---

# nb env list

設定済みの env をすべて一覧表示します。

このコマンドは保存済みの設定のみを表示します。状態を確認したい場合は [`nb env status`](./status.md) を使うのが基本です。

## 使い方


nb env list

## 出力

出力テーブルには、現在の環境マーカー、名前、種類、`API Base URL`、認証方式、ランタイムバージョンが含まれます。

- `Current` は現在有効な env を `*` で示します
- `API Base URL` は保存されている API アドレスを表示します
- `Runtime` はキャッシュされたランタイムのバージョン情報を表示します

## 使用例


nb env list

## 関連コマンド

- [`nb env current`](./current.md)
- [`nb env status`](./status.md)
- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
