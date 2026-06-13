---
title: "nb session remove"
description: "nb session remove コマンドリファレンス：`NB_SESSION_ID` のシェルまたはランタイム統合を削除します。"
keywords: "nb session remove,NocoBase CLI,NB_SESSION_ID,セッション統合削除"
---

# nb session remove

`NB_SESSION_ID` のセッション統合を削除します。

このコマンドは、以前 [`nb session setup`](./setup.md) が書き込んだシェル設定をクリーンアップします。opencode のプラグイン統合が見つかった場合は、それも削除します。

## 使い方


nb session remove [flags]

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## 使用例


nb session remove
nb session remove --shell zsh

## 関連コマンド

- [`nb session setup`](./setup.md)
- [`nb session id`](./id.md)
