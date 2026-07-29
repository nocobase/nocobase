---
title: "nb portal registry sync"
description: "nb portal registry sync コマンドリファレンス：AI Portal でプラグイン提供の Registry 項目をインストール、比較、更新します。"
keywords: "nb portal registry sync,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry sync

既存の AI Portal ワークスペースに NocoBase Portal Registry 項目をインストールします。このコマンドは、選択した NocoBase サービスから Registry インデックスを取得します。そのため、新しく有効化したプラグインの項目を Portal テンプレートへ固定的に記述せずに利用できます。

## 使用方法

```bash
nb portal registry sync <portal> [items...] [flags]
```

## 引数とフラグ

| 引数またはフラグ | 型 | 説明 |
| --- | --- | --- |
| `<portal>` | string | 必須の AI Portal 名または slug |
| `[items...]` | string[] | 任意の Registry 項目名。省略すると、有効なプラグインが提供するすべての項目をインストールします。`ai` と `@nocobase/ai` の両方を使用できます |
| `--env`, `-e` | string | CLI env 名。省略時は現在の env を使用します |
| `--yes`, `-y` | boolean | `--env` が別の env を指定する場合の確認を省略します |
| `--overwrite` | boolean | 既存の `src/components/ui` を保持したまま、インストール済み Registry ファイルを置き換えます |
| `--overwrite-ui` | boolean | `--overwrite` による `src/components/ui` の置き換えも許可します。`--overwrite` が必要です |
| `--diff` | boolean | Portal を変更せずに差分を表示します |
| `--build` | boolean | インストール後に `pnpm build` と `pnpm build:html` を実行します |

## 例

未インストールの利用可能な項目をすべてインストールします。

```bash
nb portal registry sync customer
```

指定した項目をインストールします。

```bash
nb portal registry sync customer ai acl auth-sms
```

インストール済み項目とサービス側バージョンの差分を確認します。

```bash
nb portal registry sync customer ai --diff
```

基本 UI コンポーネントを保持して項目を更新します。

```bash
nb portal registry sync customer ai --overwrite
```

Registry ファイルと基本 UI コンポーネントを上書きします。

```bash
nb portal registry sync customer --overwrite --overwrite-ui
```

インストール後に Portal をビルドします。

```bash
nb portal registry sync customer --build
```

非対話処理で別の env を使用します。

```bash
nb portal registry sync customer --env dev --yes
```

## 動作

コマンドは最初に、選択した NocoBase サービスへ Registry インデックスを要求します。サーバーは有効なプラグインの項目だけを返します。その後、Portal の `components.json` に `@nocobase` Registry を設定し、Portal ローカルの shadcn CLI で項目をインストールします。

デフォルトでは、宣言された対象ファイルがすでに存在する項目をスキップします。不足している項目と依存関係を追加する間、既存の `src/extensions` と `src/components/ui` は保護されます。

インストール済み Registry ファイルを意図的に更新する場合にのみ `--overwrite` を使用してください。`--overwrite-ui` も指定しない限り、基本 UI コンポーネントは保護されます。上書き前にローカルのカスタマイズを確認してください。

`--diff` は読み取り専用であり、`--overwrite`、`--overwrite-ui`、`--build` と同時に使用できません。

Portal に `node_modules` がない場合、shadcn の実行前に `pnpm install --frozen-lockfile` を実行します。

## 関連コマンド

- [`nb portal registry`](./index.md)
- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
