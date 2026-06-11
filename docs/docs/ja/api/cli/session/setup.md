---
title: "nb session setup"
description: "nb session setup コマンドリファレンス：`NB_SESSION_ID` のシェルまたはランタイム統合をインストールします。"
keywords: "nb session setup,NocoBase CLI,NB_SESSION_ID,シェル統合"
---

# nb session setup

`NB_SESSION_ID` のセッション統合をインストールします。

このコマンドは現在のシェルを検出するか、`--shell` で指定したシェルを使い、新しいシェルセッションで自動的に `NB_SESSION_ID` が設定されるよう対応する初期化ファイルを書き込みます。

マシン上に opencode の設定が見つかった場合は、エージェントランタイムが独自の `NB_SESSION_ID` を注入できるよう、関連するプラグイン統合も書き込みます。

## 使い方


nb session setup [flags]

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## 補足

通常はこのコマンドを 1 回実行すれば十分です。

実行後は、新しいシェルセッションを開くか profile を再読み込みして、`NB_SESSION_ID` が自動初期化されるようにしてください。

Codex のようなエージェントランタイムでは、`CODEX_THREAD_ID` のようなコンテキスト変数がすでに注入されていれば、CLI はまずその値を再利用します。

## 使用例


nb session setup
nb session setup --shell zsh
nb session setup --shell powershell

## 関連コマンド

- [`nb session id`](./id.md)
- [`nb session remove`](./remove.md)
- [`nb env use`](../env/use.md)
