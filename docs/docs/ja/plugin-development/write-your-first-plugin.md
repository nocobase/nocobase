:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 最初の**プラグイン**を作成しましょう

このガイドでは、ページで利用できるブロック**プラグイン**をゼロから作成する手順を説明します。NocoBase **プラグイン**の基本的な構造と開発フローを理解するのに役立つでしょう。

## 前提条件

始める前に、NocoBase が正常にインストールされていることを確認してください。まだインストールしていない場合は、以下のインストールガイドを参照してください。

- [create-nocobase-app を使用したインストール](/get-started/installation/create-nocobase-app)
- [Git ソースからのインストール](/get-started/installation/git)

インストールが完了したら、いよいよ**プラグイン**開発の旅を始められます。

## ステップ 1：CLI で**プラグイン**のスケルトンを作成する

リポジトリのルートディレクトリで以下のコマンドを実行し、空の**プラグイン**を素早く生成します。

```bash
yarn pm create @my-project/plugin-hello
```

コマンドが正常に実行されると、`packages/plugins/@my-project/plugin-hello` ディレクトリに基本ファイルが生成されます。デフォルトの構造は以下の通りです。

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # デフォルトでサーバーサイドプラグインをエクスポート
     ├─ client                   # クライアントサイドコードの格納場所
     │  ├─ index.tsx             # デフォルトでエクスポートされるクライアントサイドプラグインクラス
     │  ├─ plugin.tsx            # プラグインのエントリポイント（@nocobase/client Plugin を継承）
     │  ├─ models                # オプション：フロントエンドモデル（ワークフローノードなど）
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # サーバーサイドコードの格納場所
     │  ├─ index.ts              # デフォルトでエクスポートされるサーバーサイドプラグインクラス
     │  ├─ plugin.ts             # プラグインのエントリポイント（@nocobase/server Plugin を継承）
     │  ├─ collections           # オプション：サーバーサイドのコレクション
     │  ├─ migrations            # オプション：データマイグレーション
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # オプション：多言語
        ├─ en-US.json
        └─ zh-CN.json
```

作成後、ブラウザで**プラグイン**マネージャーページ（デフォルトアドレス：http://localhost:13000/admin/settings/plugin-manager ）にアクセスし、**プラグイン**がリストに表示されているか確認できます。

## ステップ 2：シンプルなクライアントブロックを実装する

次に、**プラグイン**にカスタムブロックモデルを追加し、ウェルカムテキストを表示してみましょう。

1. 新しいブロックモデルファイル `client/models/HelloBlockModel.tsx` を作成します。

```tsx pure
import { BlockModel } from '@nocobase/client';
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

2. ブロックモデルを登録します。`client/models/index.ts` を編集し、新しいモデルをエクスポートして、フロントエンドのランタイムでロードできるようにします。

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

コードを保存した後、開発スクリプトを実行している場合は、ターミナル出力にホットリロードのログが表示されるはずです。

## ステップ 3：**プラグイン**をアクティブ化して試す

コマンドラインまたは管理画面から**プラグイン**を有効にできます。

- **コマンドライン**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **管理画面**：**プラグイン**マネージャーにアクセスし、`@my-project/plugin-hello` を見つけて「アクティブ化」をクリックします。

アクティブ化後、「Modern page (v2)」ページを新規作成し、ブロックを追加する際に「Hello block」が表示されます。これをページに挿入すると、先ほど作成したウェルカムコンテンツが表示されます。

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## ステップ 4：ビルドとパッケージング

**プラグイン**を他の環境に配布する準備ができたら、まずビルドしてからパッケージングする必要があります。

```bash
yarn build @my-project/plugin-hello --tar
# または2つのステップで実行
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> ヒント：**プラグイン**がソースリポジトリで作成された場合、最初のビルドではリポジトリ全体の型チェックがトリガーされるため、時間がかかる場合があります。依存関係がインストールされており、リポジトリがビルド可能な状態であることを確認することをお勧めします。

ビルドが完了すると、パッケージファイルはデフォルトで `storage/tar/@my-project/plugin-hello.tar.gz` に配置されます。

## ステップ 5：他の NocoBase アプリケーションにアップロードする

ターゲットアプリケーションの `./storage/plugins` ディレクトリにアップロードして解凍します。詳細については、[**プラグイン**のインストールとアップグレード](../get-started/install-upgrade-plugins.mdx) を参照してください。