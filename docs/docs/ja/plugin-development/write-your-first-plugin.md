---
title: "最初の NocoBase プラグインを作成する"
description: "ゼロからブロックプラグインを作成：nb scaffold plugin、プラグインスケルトン、client/server ディレクトリ、ブロック登録、開発デバッグフロー。"
keywords: "プラグイン作成,最初のプラグイン,nb scaffold plugin,プラグインスケルトン,ブロックプラグイン,NocoBase プラグイン開発"
---

# 最初のプラグインを作成する

このドキュメントでは、ページで使用できるブロックプラグインをゼロから作成する手順を説明します。NocoBase プラグインの基本的な構造と開発フローを理解するのに役立ちます。

## 前提条件

始める前に、NocoBase CLI（`nb init`）でアプリケーションをインストール済みであることを確認してください。CLI は npm と Git の 2 つのソースをサポートしており、Git ソースの使用を推奨します（AI 開発時にソースコードを直接参照できます）。詳細は [CLI でアプリケーションをインストールする](../nocobase-cli/installation/cli.md) または [AI Agent 導入ガイド](../ai/quick-start.mdx) をご覧ください。

インストールが完了したら、開発を始められます。

## ステップ 1：CLI でプラグインスケルトンを作成する

プロジェクトルートまたは `source/` ディレクトリで以下のコマンドを実行し、空のプラグインを素早く生成します：

```bash
nb scaffold plugin @my-project/plugin-hello
```

コマンドが正常に実行されると、`<app-path>/plugins/@my-project/plugin-hello` ディレクトリに基本ファイルが生成されます（`nb` が自動的にプラグインを `source/packages/plugins/` に同期し、開発とビルドのフローで使用できるようにします）。デフォルトの構造は以下の通りです：

```bash
├─ /plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client-v2.d.ts
  ├─ client-v2.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # デフォルトでサーバーサイドプラグインをエクスポート
     ├─ client-v2                 # クライアントサイドコードの格納場所
     │  ├─ index.tsx             # デフォルトでエクスポートされるクライアントサイドプラグインクラス
     │  ├─ plugin.tsx            # プラグインエントリ（@nocobase/client-v2 Plugin を継承）
     │  ├─ models                # オプション：フロントエンドモデル（フローノードなど）
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # サーバーサイドコードの格納場所
     │  ├─ index.ts              # デフォルトでエクスポートされるサーバーサイドプラグインクラス
     │  ├─ plugin.ts             # プラグインエントリ（@nocobase/server Plugin を継承）
     │  ├─ collections           # オプション：サーバーサイドの collections
     │  ├─ migrations            # オプション：データ移行
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # オプション：多言語
        ├─ en-US.json
        └─ zh-CN.json
```

作成後、ブラウザで「プラグインマネージャー」ページ（デフォルトアドレス：http://localhost:13000/admin/settings/plugin-manager）にアクセスし、プラグインがリストに表示されているか確認できます。

## ステップ 2：シンプルなクライアントブロックを実装する

次に、プラグインにカスタムブロックモデルを追加し、ウェルカムテキストを表示してみましょう。

1. **新しいブロックモデルファイル** `client-v2/models/HelloBlockModel.tsx` を作成します：

```tsx pure
import { BlockModel } from '@nocobase/client-v2';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **ブロックモデルを登録します**。`client-v2/models/index.ts` を編集し、新しいモデルをエクスポートして、フロントエンドランタイムでロードできるようにします：

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

コードを保存した後、開発スクリプトを実行している場合は、ターミナル出力にホットリロードのログが表示されるはずです。

## ステップ 3：プラグインをアクティブ化して体験する

コマンドラインまたは管理画面からプラグインを有効にできます：

- **コマンドライン**

  ```bash
  nb plugin enable @my-project/plugin-hello
  ```

- **管理画面**：「プラグインマネージャー」にアクセスし、`@my-project/plugin-hello` を見つけて「アクティブ化」をクリックします。

アクティブ化後、新しい「Modern page (v2)」ページを作成し、ブロックを追加する際に「Hello block」が表示されます。これをページに挿入すると、先ほど作成したウェルカムコンテンツが表示されます。

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

### プラグインをデフォルトでプリセットまたはデフォルトで有効化する（オプション）

上記では単一プラグインを手動で有効化する方法を説明しました。自分の NocoBase アプリケーションを管理していて、`nocobase install`（初回インストール）や `nocobase upgrade`（アップグレード）の実行後に特定のプラグインを自動的に準備しておきたい場合は、2 つの環境変数でプラグインのデフォルト状態を制御できます：

- **`APPEND_PRESET_LOCAL_PLUGINS`（デフォルトプリセットプラグインの追加）** — プラグインをプリセット済みのローカルプラグインリストに追加します。インストール後に「プラグインマネージャー」に表示されますが、デフォルトでは無効であり、手動で有効化する必要があります
- **`APPEND_PRESET_BUILT_IN_PLUGINS`（デフォルト内蔵プラグインの追加）** — プラグインを内蔵プラグインリストに追加します。インストール時に自動的に有効化され、内蔵プラグインとして**「プラグインマネージャー」では無効化も削除もできません**

どちらの変数の値もプラグインのパッケージ名（`package.json` の `name`）で、複数のプラグインは英語のカンマで区切ります。`.env` での設定例：

```bash
# デフォルトプリセット：プラグインマネージャーのリストに表示されるが、自動的には有効化されない
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world

# デフォルト有効化：自動的にインストールして有効化され、画面から無効化できない
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world
```

通常、ローカル開発・デバッグには前述の `nb plugin enable` で十分です。これら 2 つの変数は「すぐに使える」配布シナリオに適しています——たとえば、固定のプラグインセットを含む NocoBase アプリケーションをパッケージングし、初期化後にプラグインをすぐに利用可能にしたい場合などです。

:::tip ヒント

- プラグインがローカルにダウンロードされ、`node_modules` で解決できる状態になっている必要があります。[プロジェクトディレクトリ構造](./project-structure.md)を参照してください
- 設定後、`nocobase install` または `nocobase upgrade` を再実行することで有効になります
- 環境変数の完全な説明は[環境変数](../get-started/installation/env.md#append_preset_local_plugins)を参照してください

:::

## ステップ 4：ビルドとパッケージング

プラグインを他の環境に配布する準備ができたら、まずビルドしてからパッケージングする必要があります：

```bash
nb source build @my-project/plugin-hello --tar
# または 2 つのステップで実行
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
```

:::tip 提示

プラグインがソースリポジトリで作成された場合、最初のビルドではリポジトリ全体の型チェックがトリガーされるため、時間がかかる場合があります。依存関係がインストールされており、リポジトリがビルド可能な状態であることを確認してください。

:::

ビルドが完了すると、パッケージファイルはデフォルトで `source/storage/tar/` ディレクトリに配置され、コマンドが tarball の完全なパスを表示します。

:::tip 提示

プラグインの公開前にテストケースを記述してコアロジックを検証することをおすすめします。NocoBase は完全なサーバーサイドテストツールチェーンを提供しています。詳細は [Test テスト](./server/test.md) を参照してください。

:::

## ステップ 5：他の NocoBase アプリケーションにアップロードする

パッケージファイルをターゲットアプリケーションの `./storage/plugins` ディレクトリにアップロードして解凍します。詳細な手順は [プラグインのインストールとアップグレード](../get-started/install-upgrade-plugins.mdx) を参照してください。

## 関連リンク

- [プラグイン開発の概要](./index.md) — NocoBase マイクロカーネルアーキテクチャとプラグインライフサイクルの理解
- [プロジェクトディレクトリ構造](./project-structure.md) — プロジェクトディレクトリの規約、プラグインのロードパスと優先順位
- [サーバーサイド開発の概要](./server/index.md) — サーバーサイドプラグインの全体紹介とコア概念
- [クライアントサイド開発の概要](./client/index.md) — クライアントサイドプラグインの全体紹介とコア概念
- [ビルドとパッケージング](./build.md) — プラグインのビルド、パッケージング、配布フロー
- [Test テスト](./server/test.md) — サーバーサイドプラグインのテストケース作成
- [AI Agent 導入ガイド](../ai/quick-start.mdx) — NocoBase CLI のインストールとアプリケーションの初期化
- [CLI でアプリケーションをインストールする](../nocobase-cli/installation/cli.md) — 完全なインストールフロー
- [プラグインのインストールとアップグレード](../get-started/install-upgrade-plugins.mdx) — パッケージ済みプラグインを他の環境にアップロード
- [環境変数](../get-started/installation/env.md) — プリセット・内蔵プラグインなどの環境変数設定
