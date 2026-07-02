---
title: "nb source build"
description: "nb source build コマンドリファレンス：ローカル NocoBase ソースコードプロジェクトをビルドします。"
keywords: "nb source build,NocoBase CLI,ビルド,ソースコード"
---

# nb source build

ローカル NocoBase ソースコードプロジェクトをビルドします。ソースコードディレクトリ（`<app-path>/source/`）で実行する必要があります。CLI が管理する source app の場合、ビルド前に `plugins/` ディレクトリのプラグインが自動的に `source/packages/plugins/` に同期されます。

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
| `--tar` | boolean | ビルド完了後に自動的に `.tgz` ファイルにパッケージングします |
| `--verbose` | boolean | 詳細なコマンド出力を表示します |

## 使用例

```bash
nb source build
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
nb source build --no-dts
nb source build --sourcemap
```

## 説明

`--tar` を使用すると、ビルド完了後に指定したプラグインを `.tgz` ファイルにパッケージングし、`source/storage/tar/` ディレクトリに出力します。コマンド終了時に tarball の完全なパスが表示されます。

## 関連コマンド

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
