:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# FlowModel の永続化
FlowEngine は、完全な永続化システムを提供しています。

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository
`IFlowModelRepository` は FlowEngine のモデル永続化インターフェースで、モデルのリモートからの読み込み、保存、削除といった操作を定義しています。このインターフェースを実装することで、モデルデータをバックエンドのデータベース、API、その他のストレージメディアに永続化し、フロントエンドとバックエンド間のデータ同期を実現できます。

### 主なメソッド

- **findOne(query: Query): Promise<FlowModel \| null>**  
  一意の識別子 `uid` に基づいて、リモートからモデルデータを読み込みます。

- **save(model: FlowModel): Promise<any\>**  
  モデルデータをリモートストレージに保存します。

- **destroy(uid: string): Promise<boolean\>**  
  `uid` に基づいて、リモートストレージからモデルを削除します。

### FlowModelRepository の例

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // 実装: uid でモデルを取得
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // 実装: モデルを保存
    return model;
  }

  async destroy(uid: string) {
    // 実装: uid でモデルを削除
    return true;
  }
}
```

### FlowModelRepository の設定

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## FlowEngine が提供するモデル管理メソッド

### ローカルメソッド

```ts
flowEngine.createModel(options); // ローカルモデルインスタンスを作成
flowEngine.getModel(uid);        // ローカルモデルインスタンスを取得
flowEngine.removeModel(uid);     // ローカルモデルインスタンスを削除
```

### リモートメソッド（ModelRepository によって実装）

```ts
await flowEngine.loadModel(uid);     // リモートからモデルを読み込み
await flowEngine.saveModel(model);   // モデルをリモートに保存
await flowEngine.destroyModel(uid);  // リモートからモデルを削除
```

## モデルインスタンスメソッド

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // リモートに保存
await model.destroy();  // リモートから削除
```