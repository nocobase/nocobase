:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 初めてのブロックプラグインを作成する

始める前に、「[初めてのプラグインを作成する](../plugin-development/write-your-first-plugin.md)」を読んで、基本的なプラグインを素早く作成する方法を理解しておくことをお勧めします。このドキュメントでは、その知識を基に、シンプルなブロック機能を追加する方法を説明します。

## ステップ1：ブロックモデルファイルを作成する

プラグインディレクトリ内に、`client/models/SimpleBlockModel.tsx`というファイルを作成します。

## ステップ2：モデルの内容を記述する

ファイル内で、基本的なブロックモデルとそのレンダリングロジックを定義し、実装します。

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## ステップ3：ブロックモデルを登録する

`client/models/index.ts` ファイルで、新しく作成したモデルをエクスポートします。

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## ステップ4：ブロックを有効にして確認する

プラグインを有効にすると、「ブロックを追加」のドロップダウンメニューに、新しく追加された **Hello block** のオプションが表示されます。

動作デモ：

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## ステップ5：ブロックに設定機能を追加する

次に、**ワークフロー**（Flow）を使ってブロックに設定可能な機能を追加し、ユーザーがインターフェース上でブロックの内容を編集できるようにします。

引き続き `SimpleBlockModel.tsx` ファイルを編集します。

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

動作デモ：

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## まとめ

この記事では、シンプルなブロックプラグインを作成する方法について説明しました。具体的には、以下の内容が含まれています。

- ブロックモデルの定義と実装方法
- ブロックモデルの登録方法
- **ワークフロー**（Flow）を使ってブロックに設定機能を追加する方法

完全なソースコードは、[Simple Block サンプル](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)をご参照ください。