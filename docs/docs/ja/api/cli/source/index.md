---
title: "nb source"
description: "nb source コマンドリファレンス：ローカル NocoBase ソースコードプロジェクトの管理。ダウンロード、開発、ビルド、テストを行います。"
keywords: "nb source,NocoBase CLI,ソースコード,download,dev,build,test"
---

# nb source

ローカル NocoBase ソースコードプロジェクトを管理します。npm/Git env ではローカルソースディレクトリを使用します。Docker env では通常、[`nb app`](../app/index.md) でランタイムを管理するだけで十分です。

## 使い方

```bash
nb source <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb source download`](./download.md) | npm、Docker、または Git から NocoBase を取得します |
| [`nb source dev`](./dev.md) | npm/Git ソースコード env で開発モードを起動します |
| [`nb source build`](./build.md) | ローカルソースコードプロジェクトをビルドします |
| [`nb source test`](./test.md) | 選択したアプリケーションディレクトリでテストを実行します |

## 使用例

```bash
nb source download --source npm --version alpha
nb source download --source docker --version alpha --docker-platform auto
nb source dev --env app1
nb source build @nocobase/acl
nb source test --server --coverage
```

## 関連コマンド

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
