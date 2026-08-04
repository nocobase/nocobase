---
title: "標準コンポーネントと拡張"
description: "AI Portal の shadcn/ui をベースにしたコンポーネント基盤と、置くだけで有効になる拡張の仕組み。拡張ごとに 1 ディレクトリ、自動的に検出されてマウントされます。"
keywords: "AI Portal,shadcn/ui,コンポーネント,拡張,AppExtension,Registry,Tailwind CSS"
---

# 標準コンポーネントと拡張

:::tip 前提条件

このページを読む前に、[AI Portal 構築クイックスタート](./index.md)に従って最初の Portal を動かせていることを確認してください。

:::

Portal の画面は 2 つの部分で構成されます。`src/components/ui` が基礎コンポーネントを提供し、`src/extensions` に業務モジュールを置きます。このページではこの 2 つの使い方を説明します。

## コンポーネント基盤

`src/components/ui` の下には 60 を超える [shadcn/ui](https://ui.shadcn.com/) コンポーネントがあります。ボタン、フォーム、ダイアログ、ドロワー、テーブル、チャートなど、よく使うものは一通り揃っています。スタイルは `components.json` で設定し、アイコンには lucide を使います。

コンポーネントライブラリを導入する場合と違い、**これらのコンポーネントのソースコードはプロジェクトに帰属します**。あなたのリポジトリの中にあるので自由に変更でき、上流の更新で自動的に上書きされることもありません。

そのため、カスタマイズは直接変更するのではなく合成で行うことをおすすめします：

```tsx
// 推奨：ラップして、基礎コンポーネントの差し替え可能性を保つ
import { Button } from "@/components/ui/button";

export function SubmitButton(props) {
  return <Button variant="default" size="lg" {...props} />;
}
```

`src/components/ui/button.tsx` を直接変更しても目的は達せられますが、後から上流のバグ修正を取り込むのが面倒になります。どうしても基礎コンポーネントを変更する必要があるときは、まず上流のバージョンと比較したうえで、選択的にマージしてください。ローカルの変更を丸ごと上書きしないようにします。

:::warning 注意

Portal に Ant Design や、NocoBase の Ant Design ベースのクライアントコンポーネントを導入しないでください。Portal のスタイル体系は Tailwind CSS と shadcn/ui であり、混在させるとスタイルの衝突が起こります。この規約はテンプレートの `AGENTS.md` にすでに書かれています。

:::

## 拡張の仕組み

業務機能は拡張として書き、`src/extensions/` の下に機能モジュールごとに 1 つのディレクトリとして配置します：

```text
src/extensions/
├── nocobase-acl/               権限コンポーネント
├── nocobase-ai/                AI 対話機能
├── nocobase-route-surfaces/    ページ、ドロワー、モーダルの 3 種類のルート載体
└── nocobase-users-example/     ユーザー管理のサンプル
```

各ディレクトリには `extension.tsx` があり、`AppExtension` をデフォルトエクスポートします。テンプレートが自動的にスキャンしてロードするため、**ディレクトリに置くだけで有効になり、登録コードを変更する必要はありません**。

## AppExtension

拡張が提供できるのは次のものです：

| フィールド | 説明 |
| --- | --- |
| `id` | 拡張の識別子。必須 |
| `priority` | ロード順。数字が小さいほど先。デフォルトは 100 |
| `resources` | Refine のリソース定義。ナビゲーションメニューとルートのマッピングを決めます |
| `routes` | ルート要素。ログイン済みのルートツリーの下にマウントされます |
| `Provider` | アプリケーション全体をラップする Provider |
| `AuthRuntimeProvider` | 認証ランタイムの Provider。ログイン前から有効になります |
| `UserMenuItems` | ユーザーメニューに項目を追加します |
| `authAdapters` | 認証方式のアダプター |
| `dev` | 開発モードでのみ有効になるリソースとルート |

最小構成の拡張は次のようになります：

```tsx
import type { AppExtension } from "@/app/extension";
import { Route } from "react-router";
import { Package } from "lucide-react";
import { ProductList } from "./list";

const productsExtension: AppExtension = {
  id: "products",
  resources: [
    {
      name: "products",
      list: "/products",
      meta: {
        label: "Products",
        icon: <Package />,
        acl: { type: "collection" }, // NocoBase のデータテーブル権限判定に参加する
      },
    },
  ],
  routes: <Route path="/products" element={<ProductList />} />,
};

export default productsExtension;
```

## 組み込み拡張

テンプレートには 4 つの拡張が付属しています。そのまま使えるほか、新しいコードを書くときの最良の参考にもなります：

**`nocobase-users-example`** — NocoBase の標準 `users` テーブルをベースにした完全な CRUD モジュール。リスト、作成、編集、詳細が揃っています。新しいページを作るときは、これを参考にするよう AI に伝えてください。

**`nocobase-acl`** — 権限コンポーネント。`CanAccess`、`AclPage`、`AclRegion`、`AclField`、`RoleSwitcher` がここにあります。

**`nocobase-route-surfaces`** — 3 種類のルート載体：全画面、ドロワー、モーダル。同じ内容を独立したページとして開くことも、リストページ内でドロワーとして表示することもでき、ルートの状態は正しく同期されます。

**`nocobase-ai`** — NocoBase の AI 対話機能をフロントエンドにつなぎます。対話ウィンドウ、ストリーミング、会話履歴、ページコンテキストを含みます。これを使えば、自分の Portal に AI アシスタントを組み込めます。

## 参照のルール

拡張を書くときには 2 つのパス規約があります：

- ホストアプリケーションのものを参照するときは `@/` エイリアスを使います（例：`@/components/ui/button`）
- 拡張内部の相対参照は、自分のディレクトリの外に出ないようにします

こうすることで各拡張が自己完結し、ディレクトリごと別の Portal にコピーしてそのまま使えるようになります。

## インストール可能な公式拡張

<!-- Registry 的对外地址和可安装项清单待定，确定后补充这一节：怎么安装、有哪些可选扩展、安装后源码落在哪里 -->

組み込みの 4 つに加えて、NocoBase は必要に応じてインストールできる公式拡張群も提供する予定です。インストールするとソースコードが `src/extensions/` の下に配置され、組み込み拡張と同じくプロジェクト所有のコードになり、変更してアプリケーションとともにコミットできます。

## 国際化

文言は `src/locales/` に置かれ、テンプレートには中国語と英語が付属しています。拡張も独自の言語パックを持てます。拡張のディレクトリに `locales/` を作り、`extension.tsx` からインポートするだけです。

## 関連リンク

- [AI Portal 構築クイックスタート](./index.md) — AI が書いた最初のフロントエンド入口を動かす
- [プロジェクト構成と技術スタック](./project-structure.md) — ディレクトリ規約と主なコマンドの全体像
- [AI Agent と協働して構築](./agent-workflow.md) — 組み込み拡張を参考にして AI に新しいモジュールを書かせる
