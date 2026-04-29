---
title: "nb env list"
description: "nb env list コマンドリファレンス：設定済みの NocoBase CLI env と API 認証状態を一覧表示します。"
keywords: "nb env list,NocoBase CLI,環境一覧,認証状態"
---

# nb env list

設定済みのすべての env を一覧表示し、保存済みの Token/OAuth 認証情報を使用してアプリケーション API の認証状態を確認します。

## 使い方

```bash
nb env list
```

## 出力

出力テーブルには、現在の環境マーク、名前、タイプ、App Status、URL、認証方式、ランタイムバージョンが含まれます。

`App Status` は、CLI が現在の env の認証情報を使用してアプリケーション API にアクセスした結果のステータスです。例：`ok`、`auth failed`、`unreachable`、`unconfigured`。データベースの実行状態は [`nb db ps`](../db/ps.md) で確認してください。

## 使用例

```bash
nb env list
```

## 関連コマンド

- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
- [`nb db ps`](../db/ps.md)
