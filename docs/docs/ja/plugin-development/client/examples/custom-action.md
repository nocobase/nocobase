---
title: "カスタム操作ボタンを作る"
description: "NocoBase プラグイン実践：ActionModel + ActionSceneEnum でカスタム操作ボタンを作成し、データテーブルレベルとレコードレベルの操作をサポートします。"
keywords: "カスタム操作,ActionModel,ActionSceneEnum,操作ボタン,NocoBase"
---

# カスタム操作ボタンを作る

NocoBase では、操作（Action）はブロック内のボタンで、ビジネスロジックをトリガーします。例えば「新規作成」「編集」「削除」などです。この例では `ActionModel` を使ってカスタム操作ボタンを作り、`ActionSceneEnum` でボタンの表示シーンを制御する方法を示します。

:::tip 前提知識

以下の内容を事前に理解しておくと、開発がスムーズになります：

- [はじめてのプラグインを書く](../../write-your-first-plugin) — プラグインの作成とディレクトリ構成
- [Plugin プラグイン](../plugin) — プラグインエントリと `load()` ライフサイクル
- [FlowEngine → 操作拡張](../flow-engine/action) — ActionModel、ActionSceneEnum の基本紹介
- [i18n 国際化](../component/i18n) — 翻訳ファイルの書き方と `tExpr()` 遅延翻訳の使い方

:::

## 最終的な効果

3つのカスタム操作ボタンを作ります。それぞれ3つの操作シーンに対応します：

- **データテーブルレベル操作**（`collection`）— ブロック上部の操作バーに表示（「新規作成」ボタンの横など）
- **レコードレベル操作**（`record`）— テーブル各行の操作列に表示（「編集」「削除」の横など）
- **両方に対応**（`both`）— 両方のシーンに表示

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

完全なソースコードは [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) を参照してください。ローカルで動作確認したい場合：

```bash
yarn pm enable @nocobase-example/plugin-simple-action
```

以下、ゼロからこのプラグインを構築していきます。

## ステップ1：プラグインスケルトンの作成

リポジトリのルートで実行します：

```bash
yarn pm create @my-project/plugin-simple-action
```

詳しくは[はじめてのプラグインを書く](../../write-your-first-plugin)をご覧ください。

## ステップ2：操作モデルの作成

各操作は表示シーンの宣言が必要で、`static scene` プロパティで指定します：

| シーン       | 値                           | 説明                                     |
| ---------- | ---------------------------- | ---------------------------------------- |
| collection | `ActionSceneEnum.collection` | データテーブルに対する操作（「新規作成」ボタンなど） |
| record     | `ActionSceneEnum.record`     | 単一レコードに対する操作（「編集」「削除」ボタンなど） |
| both       | `ActionSceneEnum.both`       | 両方のシーンで使用可能                   |

### データテーブルレベル操作

`src/client-v2/models/SimpleCollectionActionModel.tsx` を新規作成：

```tsx
// src/client-v2/models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});

// registerFlow でクリックイベントをリッスンし、ctx.message でユーザーにフィードバック
SimpleCollectionActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple collection action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Collection action clicked'));
      },
    },
  },
});
```

### レコードレベル操作

`src/client-v2/models/SimpleRecordActionModel.tsx` を新規作成：

```tsx
// src/client-v2/models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});

// レコードレベル操作では ctx.model.context から現在の行のデータとインデックスを取得可能
SimpleRecordActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple record action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        const id = record?.id;
        ctx.message.info(ctx.t('Record action clicked, record ID: {{id}}, row index: {{index}}', { id, index }));
      },
    },
  },
});
```

### 両方のシーンに対応

`src/client-v2/models/SimpleBothActionModel.tsx` を新規作成：

```tsx
// src/client-v2/models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});

SimpleBothActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple both action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.info(ctx.t('Both action clicked'));
      },
    },
  },
});
```

3つの書き方の構造は同じです。違いは `static scene` の値とボタンのテキストだけです。各ボタンは `registerFlow({ on: 'click' })` でクリックイベントをリッスンし、`ctx.message` でメッセージを表示して、ボタンが正しく動作していることをユーザーが確認できるようにしています。

## ステップ3：多言語ファイルの追加

プラグインの `src/locale/` 配下の翻訳ファイルを編集します：

```json
// src/locale/zh-CN.json
{
  "Simple collection action": "简单数据表操作",
  "Simple record action": "简单记录操作",
  "Simple both action": "简单通用操作",
  "Collection action clicked": "数据表操作被点击了",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "记录操作被点击了，记录 ID：{{id}}，行索引：{{index}}",
  "Both action clicked": "通用操作被点击了"
}
```

```json
// src/locale/en-US.json
{
  "Simple collection action": "Simple collection action",
  "Simple record action": "Simple record action",
  "Simple both action": "Simple both action",
  "Collection action clicked": "Collection action clicked",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "Record action clicked, record ID: {{id}}, row index: {{index}}",
  "Both action clicked": "Both action clicked"
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

export class PluginSimpleActionClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleCollectionActionModel: {
        loader: () => import('./models/SimpleCollectionActionModel'),
      },
      SimpleRecordActionModel: {
        loader: () => import('./models/SimpleRecordActionModel'),
      },
      SimpleBothActionModel: {
        loader: () => import('./models/SimpleBothActionModel'),
      },
    });
  }
}

export default PluginSimpleActionClient;
```

## ステップ5：プラグインの有効化

```bash
yarn pm enable @my-project/plugin-simple-action
```

有効化すると、テーブルブロックの「操作の設定」からこれらのカスタム操作ボタンを追加できます。

## 完全なソースコード

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — 3つの操作シーンの完全な例

## まとめ

この例で使用した機能：

| 機能     | 使い方                                         | ドキュメント                                     |
| -------- | -------------------------------------------- | ---------------------------------------------- |
| 操作ボタン | `ActionModel` + `static scene`               | [FlowEngine → 操作拡張](../flow-engine/action) |
| 操作シーン | `ActionSceneEnum.collection / record / both / all` | [FlowEngine → 操作拡張](../flow-engine/action) |
| メニュー登録 | `define({ label })`                          | [FlowEngine 概要](../flow-engine/index.md)     |
| モデル登録 | `this.flowEngine.registerModelLoaders()`     | [Plugin プラグイン](../plugin)                   |
| 遅延翻訳 | `tExpr()`                                    | [i18n 国際化](../component/i18n)               |

## 関連リンク

- [はじめてのプラグインを書く](../../write-your-first-plugin) — ゼロからプラグインスケルトンを作成
- [FlowEngine 概要](../flow-engine/index.md) — FlowModel の基本的な使い方
- [FlowEngine → 操作拡張](../flow-engine/action) — ActionModel、ActionSceneEnum
- [FlowEngine → ブロック拡張](../flow-engine/block) — カスタムブロック
- [FlowEngine → フィールド拡張](../flow-engine/field) — カスタムフィールドコンポーネント
- [Component vs FlowModel](../component-vs-flow-model) — いつ FlowModel を使うか
- [Plugin プラグイン](../plugin) — プラグインエントリと load() ライフサイクル
- [i18n 国際化](../component/i18n) — 翻訳ファイルの書き方と tExpr の使い方
- [FlowEngine 完全ドキュメント](../../../flow-engine/index.md) — FlowModel、Flow、Context の完全リファレンス
