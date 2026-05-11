---
title: "nb env status"
description: "nb env status コマンドリファレンス：現在の env、1 つの env、またはすべての env の状態を表示します。"
keywords: "nb env status,NocoBase CLI,環境状態,API Base URL"
---

# nb env status

env の状態を表示します。既定では現在の env を確認します。特定の env を確認することもでき、`--all` を使えばすべての env を確認できます。

このコマンドは `Env`、`Status`、`API Base URL` を含む簡潔なステータステーブルを表示します。

## 使い方


nb env status [name] [flags]

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| [name] | string | Env name to inspect; uses the current env if omitted |
| --all | boolean | Show status for all configured envs |
| --json-output | boolean | Output the result as JSON |

`[name]` and `--all` cannot be used together.

## Status values

`Status` は CLI が対象 env を確認した結果です。主な値は次のとおりです。

- `ok`: env に到達でき、認証も成功している
- `auth failed`: API には到達できるが認証に失敗した
- `unreachable`: 対象アドレスに到達できない
- `unconfigured`: env 設定が不完全
- `missing`: この env に対応する管理対象アプリが存在しない

## 使用例


nb env status
nb env status app1
nb env status --all
nb env status --all --json-output

## 関連コマンド

- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
