---
title: "nb app autostart enable"
description: "nb app autostart enable のリファレンス：local または Docker env のアプリ自動起動を有効にします。"
keywords: "nb app autostart enable,NocoBase CLI,autostart,env"
---

# nb app autostart enable

1 つの env に対してアプリケーション自動起動フラグを有効にします。

このフラグは、現在のマシン上で CLI がランタイムを管理している `local` または `docker` env にのみ適用されます。これだけでアプリがすぐ起動するわけではありません。代わりに、その env が後で `nb app autostart run` によって起動できる対象に追加されます。

## 使用方法

```bash
nb app autostart enable [flags]
```

## Flags

| Flag | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 自動起動に追加する CLI env 名。省略時は現在の env を使用 |
| `--yes`, `-y` | boolean | 明示的な `--env` が現在の env と異なる場合の対話確認をスキップ |

## 例

```bash
nb app autostart enable
nb app autostart enable --env app1
nb app autostart enable --env app1 --yes
```

## 注意

CLI は、`--env` を明示的に渡した場合にのみ、対象 env が現在の env と異なるかどうかを確認します。対話端末では先に確認が入り、非対話端末や AI エージェントのフローでは、必要に応じて自分で `--yes` を付けるか、事前に `nb env use <name>` で env を切り替えてください。

対象 env が、現在のマシン上で CLI 管理されている `local` または `docker` ランタイムでない場合、このコマンドは失敗し、自動起動フラグは保存されません。

## 関連コマンド

- [`nb app autostart disable`](./disable.md)
- [`nb app autostart list`](./list.md)
- [`nb app autostart run`](./run.md)
