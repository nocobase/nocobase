:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# FlowModelを作成する

## ルートノードとして

### FlowModelインスタンスを構築する

ローカルでインスタンスを構築します。

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### FlowModelを保存する

構築したインスタンスを永続化する必要がある場合は、`save` メソッドを使って保存できます。

```ts
await model.save();
```

### リモートからFlowModelをロードする

保存済みのモデルは、`loadModel` を使ってロードできます。このメソッドは、モデルツリー全体（子ノードを含む）をロードします。

```ts
await engine.loadModel(uid);
```

### FlowModelをロードまたは作成する

モデルが存在する場合はロードし、存在しない場合は作成して保存します。

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### FlowModelをレンダリングする

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## 子ノードとして

モデル内で複数のサブコンポーネントやモジュールのプロパティや振る舞いを管理する必要がある場合、SubModelを使用します。例えば、ネストされたレイアウトや条件付きレンダリングなどのシナリオで利用されます。

### SubModelを作成する

`<AddSubModelButton />` の使用をおすすめします。

これにより、子モデルの追加、バインディング、保存などの問題を自動的に処理できます。詳細は、[AddSubModelButton の使用方法](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model) を参照してください。

### SubModelをレンダリングする

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## ForkModelとして

Forkは通常、同じモデルテンプレートを複数の場所で（ただし状態は独立して）レンダリングする必要があるシナリオで使用されます。例えば、テーブルの各行などが挙げられます。

### ForkModelを作成する

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### ForkModelをレンダリングする

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```