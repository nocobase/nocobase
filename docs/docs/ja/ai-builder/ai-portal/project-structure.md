---
title: "プロジェクト構成と技術スタック"
description: "AI Portal テンプレートの技術スタック、ディレクトリ規約、環境変数、主なコマンド。AI が書いたコードが正しい場所に置かれているか判断する助けになります。"
keywords: "AI Portal,プロジェクト構成,技術スタック,React,Vite,Refine,Tailwind CSS,shadcn/ui,環境変数"
---

# プロジェクト構成と技術スタック

:::tip 前提条件

このページを読む前に、[AI Portal 構築クイックスタート](./index.md)に従って最初の Portal を動かせていることを確認してください。

:::

日常的な開発は大部分を AI に任せて構いません。ただ、テンプレートの構成を知っておけば、AI が書いたコードが正しい場所に置かれているか判断でき、問題が起きたときの原因特定もしやすくなります。

## 技術スタック

Portal テンプレートは `@nocobase/portal-template-default` をベースにしており、ソースコードは [nocobase/portal-template-default](https://github.com/nocobase/portal-template-default) にあります。

| 技術 | 用途 |
| --- | --- |
| React 19 + TypeScript | フロントエンドフレームワーク |
| Vite | 開発サーバーとビルドツール |
| [Refine](https://refine.dev/docs/) | データ層のフレームワーク。リソース、ルーティング、フォーム、権限を扱います |
| Tailwind CSS 4 | スタイル |
| [shadcn/ui](https://ui.shadcn.com/) | コンポーネント基盤。ソースコードはプロジェクトに帰属します |
| lucide | アイコンライブラリ |
| pnpm | パッケージマネージャー |

この組み合わせは現時点で AI が最もよく知っているフロントエンド技術スタックであり、AI が書くコードの精度が高くなります。

Portal は現時点では純粋なフロントエンドプロジェクトで、ビジネスロジックは NocoBase の API や標準コンポーネントを通じて実現します。今後、AI Agent に Portal のバックエンドコードも書かせられるようにする予定です。

## ディレクトリ構成

```text
src/
├── app/            ルーティングと拡張のロード
├── pages/          ログイン、登録、パスワード再設定などのページ
├── components/     コンポーネント
│   ├── ui/         shadcn/ui のコンポーネント基盤
│   ├── app-shell/  レイアウト、ナビゲーション、ローディング状態
│   ├── auth/       認証関連のコンポーネント
│   └── ...
├── extensions/     拡張。置くだけで有効になります
├── lib/            NocoBase クライアントのラッパーと ACL ロジック
├── providers/      Refine の各種 provider
├── hooks/          カスタム hook
└── locales/        国際化の文言
```

主なポイントは次のとおりです：

- **`src/app/routes.tsx`** — ルーティング構造。ログイン済みと未ログインの 2 系統に分かれており、拡張が提供するルートは自動的に組み込まれます
- **`src/app/extensions.tsx`** — 拡張のロード処理。`import.meta.glob` で `src/extensions/*/extension.tsx` をスキャンします
- **`src/providers/data.ts`** — Refine の data provider。Refine のクエリ構文を NocoBase の API パラメーターに変換します
- **`src/lib/nocobase/client.ts`** — `NocoBaseClient`。すべてのリクエストの土台となるラッパーです
- **`src/components/ui/`** — 60 を超える shadcn/ui コンポーネント。そのまま使えます

業務ページは通常 `src/extensions/` の下に、機能モジュールごとに 1 つのディレクトリとして書きます。詳しくは[標準コンポーネントと拡張](./components.md)を参照してください。

## 主なファイル

| ファイル | 役割 |
| --- | --- |
| `AGENTS.md` | AI Agent 向けの開発規約。自分のプロジェクトのルールを追記できます |
| `components.json` | shadcn/ui の設定。スタイル、アイコンライブラリ、パスエイリアスを含みます |
| `.env` / `.env.local` | 環境変数。`nb portal dev` と `deploy` が自動的に更新します |
| `vite.config.ts` | ビルド設定。開発時の API プロキシを含みます |

## 環境変数

| 変数 | 説明 |
| --- | --- |
| `NOCOBASE_API_URL` | NocoBase REST API のルートアドレス。**必ず `/api` で終わる必要があります**。同一オリジンでのデプロイでは通常 `/api` です |
| `NOCOBASE_PORTAL_BASE` | Portal をマウントする公開パス。ローカル開発では `/`、ビルド時は `/x/main/` のような実際のデプロイパスを使います |
| `NOCOBASE_AUTHENTICATOR` | 認証器の名前。デフォルトは `basic` |
| `NOCOBASE_API_TOKEN` | 開発用の一時 token。実際の値をコミットしないでください |
| `API_CLIENT_STORAGE_PREFIX` | token の保存プレフィックス。サーバー側でカスタマイズしている場合は合わせる必要があります |
| `API_CLIENT_STORAGE_TYPE` | token の保存方式。デフォルトは `localStorage` |
| `API_CLIENT_SHARE_TOKEN` | token を共有するかどうか。デフォルトは `false` |

これらの変数は `nb portal dev` と `nb portal deploy` が自動的に書き込むため、通常は手動で変更する必要はありません。後半の 3 つは、サーバー側で認証情報の保存方式をカスタマイズしている場合にのみ揃える必要があります。

開発時に `NOCOBASE_API_URL` に絶対アドレスを指定した場合、Vite が自動的にプロキシを設定してリクエストを転送するため、CORS を自分で処理する必要はありません。

## 主なコマンド

日常的な開発で使うのは次のものだけです。依存関係のインストール、環境変数の更新、ビルドなどはすべて CLI が裏で処理します：

| コマンド | 役割 |
| --- | --- |
| `nb portal list` | 現在のアプリケーションにどんな Portal があるかを確認する |
| `nb portal info <portal>` | Portal の開発パス、デプロイパス、アクセスアドレスを確認する |
| `nb portal create <portal>` | テンプレートをベースに新しい Portal の開発ワークスペースを作成する |
| `nb portal pull <portal>` | リモートの Portal ソースコードをローカルの開発ワークスペースに取得する |
| `nb portal dev <portal>` | ローカル開発サーバーを起動し、コードの変更をリアルタイムで確認する |
| `nb portal push <portal>` | ローカルのソースコード変更をリモートに push する |
| `nb portal deploy <portal>` | ビルドしてデプロイし、変更をユーザーに反映する |
| `nb portal config <portal>` | source storage、Git の設定、開発ワークスペースのパスを調整する |
| `nb portal destroy <portal>` | Portal レコードとデプロイ済みのファイルを削除する |

各コマンドの詳細なパラメーターは [`nb portal` コマンドリファレンス](../../api/cli/portal/index.md)を参照してください。

## 開発ワークスペースの場所

Portal の開発ワークスペースは、デフォルトでは `nb portal create` または `nb portal pull` を実行したディレクトリの下に置かれます：

```text
./<portal>
```

作成時や取得時に `--path` で別の場所を指定できます。ビルド後のデプロイ成果物は別の場所にあり、対象アプリケーションの storage の下に置かれ、`nb portal deploy` が同期を担当します。普段は気にする必要はありません。

現在の Portal の開発ワークスペースがどこか分からない場合は、そのまま確認してください：

```bash
nb portal info main
```

## 関連リンク

- [AI Portal 構築クイックスタート](./index.md) — AI が書いた最初のフロントエンド入口を動かす
- [標準コンポーネントと拡張](./components.md) — shadcn/ui のコンポーネント基盤と拡張の仕組み
- [デプロイとソース管理](./deploy.md) — ビルドとデプロイの流れ、および source storage
- [AI Agent と協働して構築](./agent-workflow.md) — 自然言語で AI にページを書かせる
- [`nb portal info`](../../api/cli/portal/info.md) — Portal の開発ワークスペースの場所を確認する
