---
title: "最初の NocoBase プラグインを作成する"
description: "ゼロからブロックプラグインを作成：yarn pm create、プラグインスケルトン、client/server ディレクトリ、ブロック登録、開発デバッグフロー。"
keywords: "プラグイン作成,最初のプラグイン,yarn pm create,プラグインスケルトン,ブロックプラグイン,NocoBase プラグイン開発"
---

# 最初のプラグインを作成する

このドキュメントでは、ページで使用できるブロックプラグインをゼロから作成する手順を説明します。NocoBase プラグインの基本的な構造と開発フローを理解するのに役立ちます。

## 前提条件

始める前に、NocoBase がインストール済みであることを確認してください。まだインストールしていない場合は、以下を参照してください：

- [create-nocobase-app を使用したインストール](../get-started/installation/create-nocobase-app)
- [Git ソースからのインストール](../get-started/installation/git)

インストールが完了したら、開発を始められます。

## ステップ 1：CLI でプラグインスケルトンを作成する

リポジトリのルートディレクトリで以下のコマンドを実行し、空のプラグインを素早く生成します：

```bash
yarn pm create @my-project/plugin-hello
```

コマンドが正常に実行されると、`packages/plugins/@my-project/plugin-hello` ディレクトリに基本ファイルが生成されます。デフォルトの構造は以下の通りです：

```bash
packages/plugins/@my-project/plugin-hello/
├─ package.json
├─ README.md
├─ .npmignore
├─ client-v2.d.ts            # v2 クライアントエントリの型宣言
├─ client-v2.js              # v2 クライアントエントリ
├─ client.d.ts               # v1 クライアントエントリの型宣言
├─ client.js                 # v1 クライアントエントリ
├─ server.d.ts               # サーバーエントリの型宣言
├─ server.js                 # サーバーエントリ
└─ src
   ├─ index.ts               # デフォルトでサーバーサイドプラグインをエクスポート
   ├─ client-v2              # v2 クライアントサイドコードの格納場所
   │  ├─ index.tsx           # デフォルトでエクスポートされるクライアントサイドプラグインクラス
   │  ├─ plugin.tsx          # プラグインエントリ（@nocobase/client-v2 Plugin を継承）
   │  └─ client.d.ts
   ├─ client                 # v1 クライアントサイドコードの格納場所
   │  ├─ index.tsx
   │  ├─ plugin.tsx
   │  ├─ locale.ts
   │  ├─ models
   │  │  └─ index.ts
   │  └─ client.d.ts
   ├─ server                 # サーバーサイドコードの格納場所
   │  ├─ index.ts            # デフォルトでエクスポートされるサーバーサイドプラグインクラス
   │  ├─ plugin.ts           # プラグインエントリ（@nocobase/server Plugin を継承）
   │  └─ collections         # サーバーサイドの collections（初期状態では空ディレクトリ）
   └─ locale                 # 多言語リソース
      ├─ en-US.json
      └─ zh-CN.json
```

スケルトンが生成するのは最小限の骨組みで、`src/client-v2/` にはエントリファイルしかありません。以降の手順で使う `models/` や `locale.ts` は自分で新規作成する必要があります。

続いて開発モードを起動すると、以降はコードを修正するだけでホットリロードされます：

- プロジェクトを NocoBase CLI（`nb init`）で作成した場合は、プロジェクトのルートディレクトリ（`<app-path>`）で以下を実行します：

  ```bash
  nb source dev
  ```

- 自分で clone した NocoBase ソースリポジトリの場合は、ソースコードのルートディレクトリで以下を実行します：

  ```bash
  yarn dev
  ```

起動後、ブラウザで「プラグインマネージャー」ページ（デフォルトアドレス：http://localhost:13000/admin/settings/plugin-manager）にアクセスし、プラグインがリストに表示されているか確認します。

## ステップ 2：シンプルなクライアントブロックを実装する

次に、プラグインにカスタムブロックモデルを追加し、ウェルカムテキストを表示してみましょう。

1. **翻訳ユーティリティファイル** `src/client-v2/locale.ts` を作成します。`tExpr` は名前空間付きの翻訳式を宣言するために、`useT` はコンポーネント内で翻訳関数を取得するために使います：

```ts
import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';
// @ts-ignore
import pkg from '../../package.json';

export function useT() {
  const engine = useFlowEngine();
  return (str: string) => engine.context.t(str, { ns: [pkg.name, 'client'] });
}

export function tExpr(key: string) {
  return _tExpr(key, { ns: [pkg.name, 'client'] });
}
```

2. **新しいブロックモデルファイル** `src/client-v2/models/HelloBlockModel.tsx` を作成します：

```tsx pure
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

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

3. **ブロックモデルを登録します**。モデルファイルを作成しただけでは不十分で、フロントエンドランタイムは `models/` ディレクトリを自動的にスキャンしないため、プラグインエントリで明示的に登録する必要があります。`src/client-v2/plugin.tsx` を編集し、`load()` の中で `registerModelLoaders` を使ってモデルのロード方法を宣言します：

```tsx pure
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClientV2 extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}

export default PluginHelloClientV2;
```

`registerModelLoaders` が受け取るのは遅延ロード用の関数で、モデルは実際に使われたときに初めてロードされます。キー名（`HelloBlockModel`）はモデルのクラス名と一致させる必要があり、ランタイムはこの名前でモジュールの名前付きエクスポートからモデルクラスを取り出します。

コードを保存した後、開発モードを実行している場合は、ターミナル出力にホットリロードのログが表示されるはずです。

## ステップ 3：プラグインをアクティブ化して体験する

コマンドラインまたは管理画面からプラグインを有効にできます：

- **コマンドライン**

  ```bash
  yarn pm enable @my-project/plugin-hello
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

通常、ローカル開発・デバッグには前述の `yarn pm enable` で十分です。これら 2 つの変数は「すぐに使える」配布シナリオに適しています——たとえば、固定のプラグインセットを含む NocoBase アプリケーションをパッケージングし、初期化後にプラグインをすぐに利用可能にしたい場合などです。

:::tip ヒント

- プラグインがローカルにダウンロードされ、`node_modules` で解決できる状態になっている必要があります。[プロジェクトディレクトリ構造](./project-structure.md)を参照してください
- 設定後、`nocobase install` または `nocobase upgrade` を再実行することで有効になります
- 環境変数の完全な説明は[環境変数](../get-started/installation/env.md#append_preset_local_plugins)を参照してください

:::

## ステップ 4：ビルドとパッケージング

プラグインを他の環境に配布する準備ができたら、まずビルドしてからパッケージングする必要があります：

```bash
yarn build @my-project/plugin-hello --tar
# または 2 つのステップで実行
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

:::tip 提示

プラグインがソースリポジトリで作成された場合、最初のビルドではリポジトリ全体の型チェックがトリガーされるため、時間がかかる場合があります。依存関係がインストールされており、リポジトリがビルド可能な状態であることを確認してください。

:::

ビルドが完了すると、パッケージファイルはデフォルトで `storage/tar/` ディレクトリに配置され、ファイル名は `<パッケージ名>-<バージョン番号>.tgz` になります。たとえば `storage/tar/@my-project/plugin-hello-0.1.0.tgz` です。

:::tip 提示

プラグインの公開前にテストケースを記述してコアロジックを検証することをおすすめします。NocoBase は完全なサーバーサイドテストツールチェーンを提供しています。詳細は [Test テスト](./server/test.md) を参照してください。

:::

## ステップ 5：他の NocoBase アプリケーションにアップロードする

パッケージファイルをターゲットアプリケーションの `./storage/plugins` ディレクトリにアップロードして解凍します。詳細な手順は [プラグインのインストールとアップグレード](../get-started/install-upgrade-plugins.mdx) を参照してください。

ターゲットアプリケーションが NocoBase CLI（`nb init`）で作成されている場合は、`nb plugin import` で直接インポートすることもでき、手動で解凍する必要はありません：

```bash
nb plugin import /your/path/plugin-hello-0.1.0.tgz
```

## 関連リンク

- [プラグイン開発の概要](./index.md) — NocoBase マイクロカーネルアーキテクチャとプラグインライフサイクルの理解
- [プロジェクトディレクトリ構造](./project-structure.md) — プロジェクトディレクトリの規約、プラグインのロードパスと優先順位
- [サーバーサイド開発の概要](./server/index.md) — サーバーサイドプラグインの全体紹介とコア概念
- [クライアントサイド開発の概要](./client/index.md) — クライアントサイドプラグインの全体紹介とコア概念
- [ビルドとパッケージング](./build.md) — プラグインのビルド、パッケージング、配布フロー
- [Test テスト](./server/test.md) — サーバーサイドプラグインのテストケース作成
- [create-nocobase-app を使用したインストール](../get-started/installation/create-nocobase-app) — NocoBase のインストール方法の一つ
- [Git ソースからのインストール](../get-started/installation/git) — ソースコードからの NocoBase インストール
- [プラグインのインストールとアップグレード](../get-started/install-upgrade-plugins.mdx) — パッケージ済みプラグインを他の環境にアップロード
- [環境変数](../get-started/installation/env.md) — プリセット・内蔵プラグインなどの環境変数設定
