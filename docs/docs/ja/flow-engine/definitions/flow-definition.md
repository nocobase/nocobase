:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# FlowDefinition

FlowDefinitionは、フローの基本的な構造と設定を定義するもので、フローエンジンの主要な概念の一つです。フローのメタ情報、トリガー条件、実行ステップなどを記述します。

## 型定義

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

## 登録方法

```ts
class MyModel extends FlowModel {}

// モデルクラスを介してフローを登録します
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## プロパティの説明

### key

**型**: `string`  
**必須**: はい  
**説明**: フローの一意な識別子です。

`xxxSettings` のような一貫した命名スタイルを使用することをおすすめします。例えば、
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

この命名規則は、識別とメンテナンスを容易にし、プロジェクト全体で一貫して使用することをおすすめします。

**例**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**型**: `string`  
**必須**: いいえ  
**説明**: フローの人間が読めるタイトルです。

key と一貫したスタイルを保ち、`Xxx settings` のような命名を使用することをおすすめします。例えば、
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

この命名規則は、より明確で理解しやすく、UI表示やチームでの共同作業を容易にします。

**例**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**型**: `boolean`  
**必須**: いいえ  
**デフォルト値**: `false`  
**説明**: フローが手動でのみ実行されるかどうかを示します。

- `true`: フローは手動でのみトリガーされ、自動では実行されません。
- `false`: フローは自動で実行できます（`on` プロパティがない場合、デフォルトで自動実行されます）。

**例**:
```ts
manual: true  // 手動でのみ実行
manual: false // 自動で実行可能
```

### sort

**型**: `number`  
**必須**: いいえ  
**デフォルト値**: `0`  
**説明**: フローの実行順序です。値が小さいほど先に実行されます。

複数のフローの実行順序を制御するために、負の数を使用することもできます。

**例**:
```ts
sort: -1  // 優先的に実行
sort: 0   // デフォルトの順序
sort: 1   // 後で実行
```

### on

**型**: `FlowEvent<TModel>`  
**必須**: いいえ  
**説明**: このフローが `dispatchEvent` によってトリガーされることを許可するイベント設定です。

トリガーイベント名（文字列または `{ eventName }`）を宣言するためだけに使用され、ハンドラー関数は含まれません。

**サポートされているイベントタイプ**:
- `'click'` - クリックイベント
- `'submit'` - 送信イベント
- `'reset'` - リセットイベント
- `'remove'` - 削除イベント
- `'openView'` - ビューを開くイベント
- `'dropdownOpen'` - ドロップダウンを開くイベント
- `'popupScroll'` - ポップアップスクロールイベント
- `'search'` - 検索イベント
- `'customRequest'` - カスタムリクエストイベント
- `'collapseToggle'` - 折りたたみトグルイベント
- または任意のカスタム文字列

**例**:
```ts
on: 'click'  // クリック時にトリガー
on: 'submit' // 送信時にトリガー
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**型**: `Record<string, StepDefinition<TModel>>`  
**必須**: はい  
**説明**: フローのステップ定義です。

フローに含まれるすべてのステップを定義します。各ステップには一意のキー名があります。

**例**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**型**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**必須**: いいえ  
**説明**: フローレベルのデフォルトパラメーターです。

モデルがインスタンス化（createModel）される際に、「現在のフロー」のステップパラメーターに初期値を設定します。これは、不足している値を補完するだけで、既存の値を上書きすることはありません。固定の戻り値の形式は `{ [stepKey]: params }` です。

**例**:
```ts
// 静的なデフォルトパラメーター
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// 動的なデフォルトパラメーター
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// 非同期のデフォルトパラメーター
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## 完全な例

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'データの読み込み',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'データの処理',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'データの保存', 
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```