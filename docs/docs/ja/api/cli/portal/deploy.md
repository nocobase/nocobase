---
title: "nb portal deploy"
description: "nb portal deploy コマンドリファレンス：指定した Portal ワークスペースをビルドしてデプロイします。"
keywords: "nb portal deploy,NocoBase CLI,Portal,ビルド,デプロイ"
---

# nb portal deploy

指定した Portal ワークスペースをビルドしてデプロイします。通常はローカル開発が完了し、Portal を対象 env に更新する必要がある場合に使用します。

実行時には、ワークスペース内の `.env` と `.env.local` を先に更新してから `pnpm build` を実行します。ビルド成果物には `dist/client/index.html` が含まれている必要があります。

## 使い方

```bash
nb portal deploy <portal> [flags]
```

## パラメーター

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `<portal>` | string | Portal 名または slug |
| `--env`, `-e` | string | CLI env 名。省略した場合は現在の env を使用します |
| `--no-install` | boolean | ビルド前の `pnpm install` をスキップします |
| `--yes`, `-y` | boolean | 明示した `--env` が現在の env と異なる場合の対話確認をスキップします |

## 例

現在の env の Portal をデプロイします：

```bash
nb portal deploy customer
```

指定した env の Portal をデプロイします：

```bash
nb portal deploy customer --env dev --yes
```

依存関係のインストールをスキップし、再ビルドしてデプロイします：

```bash
nb portal deploy customer --no-install
```

## 補足

`deploy` は、すでに存在する Portal 開発ワークスペースを対象としています。ローカルにワークスペースがまだない場合は、先に [`nb portal create`](./create.md) で作成するか、[`nb portal pull`](./pull.md) で source storage から取得してください。

デプロイは CLI env config に記録された開発パスから Portal をビルドし、ビルド成果物を対象アプリ storage のデプロイディレクトリへ同期します。

デプロイは source storage や Git 設定を変更しません。これらの設定は [`nb portal config`](./config.md) によりリモート Portal レコードへ更新されます。

## 関連コマンド

- [`nb portal create`](./create.md)
- [`nb portal config`](./config.md)
- [`nb portal pull`](./pull.md)
- [`nb portal push`](./push.md)
