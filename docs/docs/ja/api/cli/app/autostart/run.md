---
title: "nb app autostart run"
description: "nb app autostart run のリファレンス：アプリ自動起動が有効なすべての env を起動します。"
keywords: "nb app autostart run,NocoBase CLI,autostart,一括起動"
---

# nb app autostart run

アプリ自動起動が有効なすべての env を起動します。

このコマンドは通常、ホストシステムの起動後に、あなた自身の起動メカニズムから呼び出します。CLI は保存済みのすべての env を読み込み、自動起動が有効なものだけを抽出し、その後 1 つずつ起動を試みます。

## 使用方法

```bash
nb app autostart run [flags]
```

## Flags

| Flag | 型 | 説明 |
| --- | --- | --- |
| `--verbose` | boolean | 下層の local または Docker 起動コマンドの生出力を表示 |

## 例

```bash
nb app autostart run
nb app autostart run --verbose
```

## 注意

自動起動が有効な env が 1 つもない場合、このコマンドは `No environments have app autostart enabled.` を出力します。

実行中、CLI は有効な各 env を 1 つずつ処理します。

- 起動可能な env は `started`
- 現在のマシンで自動起動すべきでない env は `skipped`
- 起動に失敗した env は `failed`

内部的には `nb app start --env <name> --yes` を呼び出します。`--verbose` を付けると、このフラグも下層の起動フローへ引き継がれます。

結果に `failed` が 1 つでも含まれる場合、コマンドはエラー終了し、`Some app autostart envs failed to start.` を出力します。これにより、`systemd`、CI、その他のホスト起動メカニズムで失敗を明確に検知できます。

## 関連コマンド

- [`nb app autostart enable`](./enable.md)
- [`nb app start`](../start.md)
- [`nb app logs`](../logs.md)
