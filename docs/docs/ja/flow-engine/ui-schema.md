---
title: "UI Schema"
description: "NocoBase UI Schema 構文リファレンス：Formily Schema ベースのコンポーネント記述プロトコル。type、x-component、x-decorator、x-pattern などのプロパティの説明。"
keywords: "UI Schema,uiSchema,Formily,x-component,x-decorator,x-pattern,x-display,NocoBase"
---

# UI Schema

UI Schema は NocoBase がフロントエンドコンポーネントを記述するためのプロトコルで、[Formily Schema 2.0](https://react.formilyjs.org/api/shared/schema) をベースとした JSON Schema 風のスタイルです。FlowEngine では、`registerFlow` の `uiSchema` フィールドがこの構文を使用して設定パネルの UI を定義します。

```ts
interface ISchema {
  type: 'void' | 'string' | 'number' | 'object' | 'array';
  name?: string;
  title?: any;
  // ラッパーコンポーネント
  ['x-decorator']?: string;
  // ラッパーコンポーネントのプロパティ
  ['x-decorator-props']?: any;
  // コンポーネント
  ['x-component']?: string;
  // コンポーネントのプロパティ
  ['x-component-props']?: any;
  // 表示状態、デフォルトは 'visible'
  ['x-display']?: 'none' | 'hidden' | 'visible';
  // コンポーネントの子ノード
  ['x-content']?: any;
  // children ノードの schema
  properties?: Record<string, ISchema>;

  // 以下はフィールドコンポーネント使用時のみ

  // フィールドの連動
  ['x-reactions']?: SchemaReactions;
  // フィールド UI インタラクションモード、デフォルトは 'editable'
  ['x-pattern']?: 'editable' | 'disabled' | 'readPretty';
  // フィールドバリデーション
  ['x-validator']?: Validator;
  // デフォルトデータ
  default?: any;
}
```

## 基本的な使い方

### 最もシンプルなコンポーネント

すべてのネイティブ HTML タグは schema の記法に変換できます：

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

これは以下の JSX と同等です：

```tsx
<h1>Hello, world!</h1>
```

### 子コンポーネント

children コンポーネントは `properties` に記述します：

```ts
{
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      'x-component': 'input',
    },
  },
}
```

これは以下の JSX と同等です：

```tsx
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

## プロパティの説明

### type

ノードのタイプ：

```ts
type SchemaTypes = 'string' | 'object' | 'array' | 'number' | 'boolean' | 'void';
```

### name

schema の名前。子ノードの name は `properties` のキーになります：

```ts
{
  name: 'root',
  properties: {
    child1: {
      // ここでは name を再度記述する必要はありません
    },
  },
}
```

### title

ノードのタイトル。通常はフォームフィールドのラベルとして使用されます。

### x-component

コンポーネント名。ネイティブ HTML タグまたは登録済みの React コンポーネントを使用できます：

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

### x-component-props

コンポーネントのプロパティ：

```ts
{
  type: 'void',
  'x-component': 'Table',
  'x-component-props': {
    loading: true,
  },
}
```

### x-decorator

ラッパーコンポーネント。`x-decorator` + `x-component` の組み合わせにより、2 つのコンポーネントを 1 つの schema ノードに配置できます。これにより、構造の複雑さを軽減し、再利用性を向上させます。

例えば、フォームのシナリオでは、`FormItem` が decorator になります：

```ts
{
  type: 'void',
  'x-component': 'div',
  properties: {
    title: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    content: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
}
```

これは以下の JSX と同等です：

```tsx
<div>
  <FormItem>
    <Input name={'title'} />
  </FormItem>
  <FormItem>
    <Input.TextArea name={'content'} />
  </FormItem>
</div>
```

### x-display

コンポーネントの表示状態：

| 値 | 説明 |
|----|------|
| `'visible'` | コンポーネントを表示（デフォルト） |
| `'hidden'` | コンポーネントを非表示にするが、データは非表示にしない |
| `'none'` | コンポーネントを非表示にし、データも非表示にする |

### x-pattern

フィールドコンポーネントのインタラクションモード：

| 値 | 説明 |
|----|------|
| `'editable'` | 編集可能（デフォルト） |
| `'disabled'` | 編集不可 |
| `'readPretty'` | 読み取り専用表示モード -- 例えば、テキスト入力コンポーネントは編集モードでは `<input />` ですが、読み取り専用表示モードでは `<div />` になります |

## registerFlow での使用

プラグイン開発では、uiSchema は主に `registerFlow` の設定パネルで使用されます。各フィールドは通常 `'x-decorator': 'FormItem'` でラップします：

```ts
MyModel.registerFlow({
  key: 'flow1',
  on: 'beforeRender',
  steps: {
    editTitle: {
      title: 'タイトルの編集',
      uiSchema: {
        title: {
          type: 'string',
          title: 'タイトル',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        showBorder: {
          type: 'boolean',
          title: 'ボーダーを表示',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        color: {
          type: 'string',
          title: '色',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '赤', value: 'red' },
            { label: '青', value: 'blue' },
            { label: '緑', value: 'green' },
          ],
        },
      },
      handler(ctx, params) {
        ctx.model.props.title = params.title;
        ctx.model.props.showBorder = params.showBorder;
        ctx.model.props.color = params.color;
      },
    },
  },
});
```

:::tip ヒント

v2 では uiSchema 構文の互換性が保たれていますが、使用シナリオは限定的です。主に Flow の設定パネルでフォーム UI を記述するために使用します。ほとんどのランタイムのコンポーネントレンダリングには、[Antd コンポーネント](https://5x.ant.design/components/overview) を直接使用することをお勧めします。

:::

## よく使うコンポーネントクイックリファレンス

| コンポーネント | x-component | type | 説明 |
|------|-------------|------|------|
| テキスト入力 | `Input` | `string` | 基本的なテキスト入力 |
| テキストエリア | `Input.TextArea` | `string` | 複数行テキスト |
| 数値 | `InputNumber` | `number` | 数値入力 |
| スイッチ | `Switch` | `boolean` | ブールスイッチ |
| ドロップダウン選択 | `Select` | `string` | `enum` と組み合わせてオプションを提供する必要があります |
| ラジオボタン | `Radio.Group` | `string` | `enum` と組み合わせてオプションを提供する必要があります |
| チェックボックス | `Checkbox.Group` | `string` | `enum` と組み合わせてオプションを提供する必要があります |
| 日付 | `DatePicker` | `string` | 日付ピッカー |

## 関連リンク

- [FlowEngine 概要（プラグイン開発）](../plugin-development/client/flow-engine/index.md) -- registerFlow 内での uiSchema の実際の使用方法
- [FlowDefinition フロー定義](./definitions/flow-definition.md) -- registerFlow の完全なパラメータ説明
- [Formily Schema ドキュメント](https://react.formilyjs.org/api/shared/schema) -- uiSchema のベースとなる Formily プロトコル
