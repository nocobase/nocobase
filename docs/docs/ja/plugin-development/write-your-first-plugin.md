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
├─ /packages/plugins/@my-project/plugin-hello
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
  yarn pm enable @my-project/plugin-hello
  ```

- **管理画面**：「プラグインマネージャー」にアクセスし、`@my-project/plugin-hello` を見つけて「アクティブ化」をクリックします。

アクティブ化後、新しい「Modern page (v2)」ページを作成し、ブロックを追加する際に「Hello block」が表示されます。これをページに挿入すると、先ほど作成したウェルカムコンテンツが表示されます。

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

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

ビルドが完了すると、パッケージファイルはデフォルトで `storage/tar/@my-project/plugin-hello.tar.gz` に配置されます。

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
- [create-nocobase-app を使用したインストール](../get-started/installation/create-nocobase-app) — NocoBase のインストール方法の一つ
- [Git ソースからのインストール](../get-started/installation/git) — ソースコードからの NocoBase インストール
- [プラグインのインストールとアップグレード](../get-started/install-upgrade-plugins.mdx) — パッケージ済みプラグインを他の環境にアップロード
