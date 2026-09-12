---
title: "nb app autostart"
description: "nb app autostart コマンドグループのリファレンス：local または Docker env の自動起動を有効・無効にし、有効な env をまとめて起動します。"
keywords: "nb app autostart,NocoBase CLI,autostart,local,docker"
---

# nb app autostart

アプリケーションの自動起動設定を管理します。

このコマンドグループは次の 2 種類の作業を扱います。

- 1 つの env に対して自動起動フラグを有効または無効にする
- すでに自動起動が有効な env をすべて起動する

`nb app autostart` は、現在のマシン上で CLI がランタイムを管理している env、つまり `local` と `docker` にのみ適用されます。env が単なるリモート API 接続である場合、またはこのマシンで起動可能な CLI 管理アプリランタイムでない場合、この自動起動フローには参加できません。

## 使用方法

```bash
nb app autostart <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb app autostart enable`](./enable.md) | 1 つの env の自動起動を有効にする |
| [`nb app autostart disable`](./disable.md) | 1 つの env の自動起動を無効にする |
| [`nb app autostart list`](./list.md) | すべての env の自動起動状態を表示する |
| [`nb app autostart run`](./run.md) | 有効な env をすべて起動する |

## 注意

`nb app autostart enable` は env を自動起動可能としてマークするだけです。これだけで OS の起動フローに組み込まれるわけではありません。実際の本番構成では、通常 `systemd`、コンテナプラットフォームの起動スクリプト、または既存のホスト起動処理などから `nb app autostart run` を呼び出す必要があります。

また、`nb app autostart run` は有効な env を 1 つずつ確認します。起動可能な env は内部的に `nb app start --env <name> --yes` へ進みます。現在のマシンで自動起動すべきでない env は、結果テーブルで `skipped` または `failed` として表示されます。

## 例

```bash
nb app autostart enable
nb app autostart enable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## 関連コマンド

- [`nb app start`](../start.md)
- [`nb app stop`](../stop.md)
- [`nb env list`](../../env/list.md)
- [`nb env use`](../../env/use.md)
