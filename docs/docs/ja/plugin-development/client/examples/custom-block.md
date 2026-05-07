---
title: "カスタム表示ブロックを作る"
description: "NocoBase プラグイン実践：BlockModel + registerFlow + uiSchema で設定可能な HTML 表示ブロックを作ります。"
keywords: "カスタムブロック,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# カスタム表示ブロックを作る

NocoBase では、ブロックはページ上のコンテンツ領域です。この例では `BlockModel` を使って最もシンプルなカスタムブロックを作る方法を示します。画面上で HTML コンテンツを編集でき、ユーザーが設定パネルからブロックの表示内容を変更できます。

これは FlowEngine を使う最初の例で、`BlockModel`、`renderComponent`、`registerFlow`、`uiSchema` を使用します。

:::tip 前提知識

以下の内容を事前に理解しておくと、開発がスムーズになります：

- [はじめてのプラグインを書く](../../write-your-first-plugin) — プラグインの作成とディレクトリ構成
- [Plugin プラグイン](../plugin) — プラグインエントリと `load()` ライフサイクル
- [FlowEngine 概要](../flow-engine/index.md) — FlowModel、renderComponent、registerFlow の基本的な使い方
- [i18n 国際化](../component/i18n) — 翻訳ファイルの書き方と `tExpr()` 遅延翻訳の使い方

:::

## 最終的な効果

「Simple block」ブロックを作ります：

- 「ブロックの追加」メニューに表示される
- ユーザーが設定した HTML コンテンツをレンダリング
- 設定パネル（registerFlow + uiSchema）でユーザーが HTML を編集可能

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

完全なソースコードは [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) を参照してください。ローカルで動作確認したい場合：

```bash
yarn pm enable @nocobase-example/plugin-simple-block
```

以下、ゼロからこのプラグインを構築していきます。

## ステップ1：プラグインスケルトンの作成

リポジトリのルートで実行します：

```bash
yarn pm create @my-project/plugin-simple-block
```

`packages/plugins/@my-project/plugin-simple-block` 配下に基本的なファイル構成が生成されます。詳しくは[はじめてのプラグインを書く](../../write-your-first-plugin)をご覧ください。

## ステップ2：ブロックモデルの作成

`src/client-v2/models/SimpleBlockModel.tsx` を新規作成します。これがプラグインの中核で、ブロックのレンダリング方法と設定方法を定義します。

```tsx
// src/client-v2/models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

// 「ブロックの追加」メニューでの表示名を設定
SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

// 設定パネルを登録し、ユーザーが HTML コンテンツを編集可能にする
SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // レンダリング前に実行
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema で設定パネルのフォーム UI を定義
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // 設定パネルのデフォルト値
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // 設定パネルの値を model の props に書き込む
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

重要なポイント：

- **`renderComponent()`** — ブロックの UI をレンダリングし、`this.props.html` から HTML コンテンツを読み取る
- **`define()`** — 「ブロックの追加」メニューでの表示名を設定。`tExpr()` は遅延翻訳に使用（`define()` はモジュール読み込み時に実行され、その時点では i18n がまだ初期化されていないため）
- **`registerFlow()`** — 設定パネルを追加。`uiSchema` で JSON Schema 形式のフォームを定義（構文は [UI Schema](../../../../flow-engine/ui-schema) を参照）、`handler` でユーザーが入力した値を `ctx.model.props` に設定し、`renderComponent()` から読み取れるようにする

## ステップ3：多言語ファイルの追加

プラグインの `src/locale/` 配下の翻訳ファイルを編集し、`tExpr()` で使用する key の翻訳を追加します：

```json
// src/locale/zh-CN.json
{
  "Simple block": "简单区块",
  "Simple Block Flow": "简单区块配置",
  "Edit HTML Content": "编辑 HTML 内容",
  "HTML Content": "HTML 内容"
}
```

```json
// src/locale/en-US.json
{
  "Simple block": "Simple block",
  "Simple Block Flow": "Simple Block Flow",
  "Edit HTML Content": "Edit HTML Content",
  "HTML Content": "HTML Content"
}
```

:::warning 注意

初めて言語ファイルを追加した場合、アプリの再起動が必要です。

:::

翻訳ファイルの書き方と `tExpr()` のその他の使い方については、[i18n 国際化](../component/i18n)をご覧ください。

## ステップ4：プラグインへの登録

`src/client-v2/plugin.tsx` を編集し、`registerModelLoaders` で遅延読み込み登録します：

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleBlockClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        // 遅延読み込み。初めて使用される時にモジュールをロード
        loader: () => import('./models/SimpleBlockModel'),
      },
    });
  }
}

export default PluginSimpleBlockClient;
```

`registerModelLoaders` は動的インポートを使用し、モデルコードは実際に必要になった時に初めてロードされます。これが推奨される登録方法です。

## ステップ5：プラグインの有効化

```bash
yarn pm enable @my-project/plugin-simple-block
```

有効化後、新しいページを作成して「ブロックの追加」をクリックすると「Simple block」が表示されます。追加後、ブロックの設定ボタンをクリックして HTML コンテンツを編集できます。

## 完全なソースコード

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — カスタム表示ブロックの完全な例

## まとめ

この例で使用した機能：

| 機能     | 使い方                               | ドキュメント                                    |
| -------- | ---------------------------------- | --------------------------------------------- |
| ブロックレンダリング | `BlockModel` + `renderComponent()` | [FlowEngine → ブロック拡張](../flow-engine/block) |
| メニュー登録 | `define({ label })`                | [FlowEngine 概要](../flow-engine/index.md)    |
| 設定パネル | `registerFlow()` + `uiSchema`      | [FlowEngine 概要](../flow-engine/index.md)    |
| モデル登録 | `registerModelLoaders`（遅延読み込み） | [Plugin プラグイン](../plugin)                  |
| 遅延翻訳 | `tExpr()`                          | [i18n 国際化](../component/i18n)              |

## 関連リンク

- [はじめてのプラグインを書く](../../write-your-first-plugin) — ゼロからプラグインスケルトンを作成
- [FlowEngine 概要](../flow-engine/index.md) — FlowModel の基本的な使い方と registerFlow
- [FlowEngine → ブロック拡張](../flow-engine/block) — BlockModel、DataBlockModel、CollectionBlockModel
- [UI Schema](../../../../flow-engine/ui-schema) — uiSchema の構文リファレンス
- [Component vs FlowModel](../component-vs-flow-model) — いつ FlowModel を使うか
- [Plugin プラグイン](../plugin) — プラグインエントリと load() ライフサイクル
- [i18n 国際化](../component/i18n) — 翻訳ファイルの書き方と tExpr の使い方
- [FlowEngine 完全ドキュメント](../../../flow-engine/index.md) — FlowModel、Flow、Context の完全リファレンス
