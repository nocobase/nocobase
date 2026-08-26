---
title: "nb source build"
description: "nb source build コマンドリファレンス：ローカル NocoBase ソースコードプロジェクトをビルドします。"
keywords: "nb source build,NocoBase CLI,ビルド,ソースコード"
---

# nb source build

ローカル NocoBase ソースコードプロジェクトをビルドします。このコマンドはリポジトリのルートディレクトリで従来の NocoBase ビルドプロセスを転送実行します。

## 使い方

```bash
nb source build [packages...] [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `[packages...]` | string[] | ビルドするパッケージ名。省略時はすべてをビルドします |
| `--cwd`, `-c` | string | 作業ディレクトリ |
| `--no-dts` | boolean | `.d.ts` 宣言ファイルを生成しません |
| `--sourcemap` | boolean | sourcemap を生成します |
| `--verbose` | boolean | 詳細なコマンド出力を表示します |

## 使用例

```bash
nb source build
nb source build --no-dts
nb source build --sourcemap
nb source build @nocobase/acl
nb source build @nocobase/acl @nocobase/actions
```

## 関連コマンド

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
