:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/model)をご参照ください。
:::

# ctx.model

現在の RunJS 実行コンテキストが配置されている `FlowModel` インスタンスであり、JSBlock、JSField、JSAction などのシナリオにおけるデフォルトのエントリポイントです。具体的な型はコンテキストに応じて変化し、`BlockModel`、`ActionModel`、`JSEditableFieldModel` などのサブクラスになる可能性があります。

## 適用シーン

| シナリオ | 説明 |
|------|------|
| **JSBlock** | `ctx.model` は現在のブロックモデルです。`resource`、`collection`、`setProps` などにアクセスできます。 |
| **JSField / JSItem / JSColumn** | `ctx.model` はフィールドモデルです。`setProps`、`dispatchEvent` などにアクセスできます。 |
| **操作イベント / ActionModel** | `ctx.model` はアクションモデルです。ステップパラメータの読み書きやイベントのディスパッチなどが可能です。 |

> ヒント：**現在の JS を保持している親ブロック**（フォームやテーブルブロックなど）にアクセスする必要がある場合は `ctx.blockModel` を使用し、**他のモデル**にアクセスする場合は `ctx.getModel(uid)` を使用します。

## 型定義

```ts
model: FlowModel;
```

`FlowModel` は基底クラスであり、実際の実行時はさまざまなサブクラス（`BlockModel`、`FormBlockModel`、`TableBlockModel`、`JSEditableFieldModel`、`ActionModel` など）のインスタンスとなります。利用可能なプロパティやメソッドは型によって異なります。

## 常用プロパティ

| プロパティ | 型 | 説明 |
|------|------|------|
| `uid` | `string` | モデルの一意識別子。`ctx.getModel(uid)` やポップアップの UID バインドに使用できます。 |
| `collection` | `Collection` | 現在のモデルにバインドされているコレクション（ブロックやフィールドがデータにバインドされている場合に存在します）。 |
| `resource` | `Resource` | 関連付けられたリソースインスタンス。リフレッシュや選択行の取得などに使用されます。 |
| `props` | `object` | モデルの UI/動作設定。`setProps` を使用して更新できます。 |
| `subModels` | `Record<string, FlowModel>` | 子モデルの集合（フォーム内のフィールド、テーブル内の列など）。 |
| `parent` | `FlowModel` | 親モデル（存在する場合）。 |

## 常用メソッド

| メソッド | 説明 |
|------|------|
| `setProps(partialProps: any): void` | モデルの設定を更新し、再レンダリングをトリガーします（例：`ctx.model.setProps({ loading: true })`）。 |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | モデルにイベントをディスパッチし、そのモデル上で設定された、そのイベント名をリッスンするワークフローをトリガーします。オプションの `payload` はワークフローのハンドラーに渡されます。`options.debounce` でデバウンスを有効にできます。 |
| `getStepParams?.(flowKey, stepKey)` | 設定フローのステップパラメータを読み取ります（設定パネルやカスタムアクションなどのシナリオで使用）。 |
| `setStepParams?.(flowKey, stepKey, params)` | 設定フローのステップパラメータを書き込みます。 |

## ctx.blockModel、ctx.getModel との関係

| ニーズ | 推奨される使い方 |
|------|----------|
| **現在の実行コンテキストのモデル** | `ctx.model` |
| **現在の JS の親ブロック** | `ctx.blockModel`。`resource`、`form`、`collection` へのアクセスによく使用されます。 |
| **UID で任意のモデルを取得** | `ctx.getModel(uid)` または `ctx.getModel(uid, true)`（ビュースタックを横断して検索）。 |

JSField 内では、`ctx.model` はフィールドモデルであり、`ctx.blockModel` はそのフィールドを保持するフォーム/テーブルブロックです。

## 実行例

### ブロック/アクションの状態を更新する

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### モデルイベントをディスパッチする

```ts
// イベントをディスパッチし、このモデル上で設定された、このイベント名をリッスンするワークフローをトリガーします
await ctx.model.dispatchEvent('remove');
// payload を指定すると、ワークフローハンドラーの ctx.inputArgs に渡されます
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### UID を使用したポップアップのバインドまたはモデル間アクセス

```ts
const myUid = ctx.model.uid;
// ポップアップの設定で openerUid: myUid を渡すことで関連付けが可能です
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## 関連情報

- [ctx.blockModel](./block-model.md)：現在の JS が配置されている親ブロックモデル
- [ctx.getModel()](./get-model.md)：UID で他のモデルを取得する