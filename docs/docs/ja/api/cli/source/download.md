---
title: "nb source download"
description: "nb source download コマンドリファレンス：npm、Docker、または Git から NocoBase のソースコードまたはイメージを取得します。"
keywords: "nb source download,NocoBase CLI,ダウンロード,npm,Docker,Git"
---

# nb source download

npm、Docker、または Git から NocoBase を取得します。`--version` は 3 つの source で共通のバージョンパラメータです。npm ではパッケージバージョン、Docker ではイメージ tag、Git では git ref を指定します。

## 使い方

```bash
nb source download [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--yes`, `-y` | boolean | デフォルト値を使用し、インタラクティブプロンプトをスキップします |
| `--verbose` | boolean | 詳細なコマンド出力を表示します |
| `--locale` | string | CLI プロンプトの言語：`en-US` または `zh-CN` |
| `--source`, `-s` | string | 取得方法：`docker`、`npm`、または `git` |
| `--version`, `-v` | string | npm パッケージバージョン、Docker イメージ tag、または Git ref |
| `--replace`, `-r` | boolean | ターゲットディレクトリが既に存在する場合に置き換えます |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | npm/Git インストール時に devDependencies もインストールするかどうか |
| `--output-dir`, `-o` | string | ダウンロード先ディレクトリ、または Docker tarball の保存ディレクトリ |
| `--git-url` | string | Git リポジトリの URL |
| `--docker-registry` | string | Docker イメージリポジトリ名（tag を含まない） |
| `--docker-platform` | string | Docker イメージプラットフォーム：`auto`、`linux/amd64`、`linux/arm64` |
| `--docker-save` / `--no-docker-save` | boolean | Docker イメージを pull した後に tarball として保存するかどうか |
| `--npm-registry` | string | npm/Git のダウンロードおよび依存関係のインストールに使用する registry |
| `--build` / `--no-build` | boolean | npm/Git の依存関係インストール後にビルドを行うかどうか |
| `--build-dts` | boolean | npm/Git ビルド時に TypeScript 宣言ファイルを生成するかどうか |

## 使用例

```bash
nb source download
nb source download -y --source npm --version alpha
nb source download -y --source npm --version alpha --no-build
nb source download --source npm --version alpha --output-dir=./app
nb source download --source docker --version alpha --docker-registry=nocobase/nocobase --docker-platform=linux/arm64
nb source download -y --source docker --version alpha --docker-save -o ./docker-images
nb source download --source git --version alpha --git-url=git@github.com:nocobase/nocobase.git
nb source download --source git --version fix/cli-v2
nb source download -y --source npm --version alpha --build-dts
nb source download -y --source npm --version alpha --npm-registry=https://registry.npmmirror.com
```

## バージョンエイリアス

Git source の場合、よく使われる dist-tag は対応するブランチに解決されます：`latest` -> `main`、`beta` -> `next`、`alpha` -> `develop`。

## 関連コマンド

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
