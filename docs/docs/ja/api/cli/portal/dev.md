---
title: "nb portal dev"
description: "nb portal dev コマンドリファレンス：指定した Portal のローカルソースディレクトリの開発モードを起動します。"
keywords: "nb portal dev,NocoBase CLI,Portal,開発モード,ローカル開発"
---

# nb portal dev

指定した Portal のローカルソースディレクトリの開発モードを起動します。通常は [`nb portal create`](./create.md) または [`nb portal pull`](./pull.md) の実行後に使用します。

実行時にローカルソースディレクトリ内の `.env` と `.env.local` を更新し、その後 Portal のローカルソースディレクトリで `pnpm dev` を実行します。

## 使い方

```bash
nb portal dev <portal> [flags]
```

## パラメーター

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `<portal>` | string | Portal 名または slug |
| `--env`, `-e` | string | CLI env 名。省略時は current env を使用します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が current env と異なる場合に、対話確認をスキップします |

## 例

current env の Portal 開発モードを起動する：

```bash
nb portal dev customer
```

指定した env の Portal 開発モードを起動する：

```bash
nb portal dev customer --env dev --yes
```

## 補足

`dev` は Portal のローカルソースディレクトリを使って開発サーバーを起動します。Portal レコードの作成もリモートソースの取得も行いません。ローカルソースディレクトリが存在しない場合は、先に [`nb portal create`](./create.md) または [`nb portal pull`](./pull.md) を使用してください。

ローカルソースディレクトリには `package.json` が必要です。`ssh` env は現時点では Portal 開発モードの起動に対応していません。

## 関連コマンド

- [`nb portal create`](./create.md)
- [`nb portal pull`](./pull.md)
- [`nb portal deploy`](./deploy.md)
