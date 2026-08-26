---
title: "nb session"
description: "nb session コマンドリファレンス：`NB_SESSION_ID` を設定および確認し、現在の env をシェルまたはエージェントランタイムごとに分離します。"
keywords: "nb session,NocoBase CLI,NB_SESSION_ID,session mode"
---

# nb session

`NB_SESSION_ID` の session mode を管理します。

session mode を有効にすると、`nb env use` と `nb env current` は単一のグローバル current env を直接共有する代わりに、現在のシェルまたはエージェントランタイムのコンテキストを優先して使います。

## 使い方


nb session <command>

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb session setup`](./setup.md) | `NB_SESSION_ID` のシェルまたはランタイム統合をインストールします |
| [`nb session id`](./id.md) | 現在有効なセッション ID を表示します |
| [`nb session remove`](./remove.md) | `NB_SESSION_ID` のシェルまたはランタイム統合を削除します |

## 必要になる場面

CLI を使い始めるときに、一度 `nb session setup` を実行するのが基本のおすすめです。これにより、

- ターミナル 1 は `env1` を使える
- ターミナル 2 は同時に `env2` を使える
- エージェントランタイムも独自の current env を保持できる

session mode がない場合、異なるセッションはフォールバックとして同じグローバル `last env` を共有するため、並行作業で干渉しやすくなります。

## 関連コマンド

- [`nb env current`](../env/current.md)
- [`nb env use`](../env/use.md)
- [`nb env status`](../env/status.md)
