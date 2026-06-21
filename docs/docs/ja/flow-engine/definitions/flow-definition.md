---
title: "FlowDefinition フロー定義"
description: "FlowDefinition はフローの基本構造と設定を定義します：key、on、steps、defaultParams。フローのメタ情報、トリガー条件、実行ステップを記述する FlowEngine のコア型です。"
keywords: "FlowDefinition,フロー定義,Flow 設定,on,steps,defaultParams,FlowEngine 型,NocoBase"
---

# FlowDefinition

FlowDefinition はフローの基本構造と設定を定義するもので、フローエンジンのコア概念の一つです。フローのメタ情報、トリガー条件、実行ステップなどを記述します。

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

`on` の型は以下の通りです：

```ts
type FlowEventPhase =
  | 'beforeAllFlows'
  | 'afterAllFlows'
  | 'beforeFlow'
  | 'afterFlow'
  | 'beforeStep'
  | 'afterStep';

type FlowEvent<TModel extends FlowModel = FlowModel> =
  | string
  | {
      eventName: string;
      defaultParams?: Record<string, any>;
      phase?: FlowEventPhase;
      flowKey?: string;
      stepKey?: string;
    };
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

`xxxSettings` のような統一的な命名スタイルを採用することをおすすめします。例えば：
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

この命名規則は識別とメンテナンスを容易にし、プロジェクト全体で統一することをおすすめします。

**例**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**型**: `string`  
**必須**: いいえ  
**説明**: 人間が読めるフローのタイトルです。

key と一貫したスタイルで、`Xxx settings` の命名を使用することをおすすめします。例えば：
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

この命名規則はより明確で理解しやすく、UI 表示やチーム間の共同作業を容易にします。

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

- `true`: フローは手動でのみトリガーされ、自動実行されません
- `false`: フローは自動実行可能です（`on` プロパティがない場合、デフォルトで自動実行されます）

**例**:
```ts
manual: true  // 手動でのみ実行
manual: false // 自動実行可能
```

### sort

**型**: `number`  
**必須**: いいえ  
**デフォルト値**: `0`  
**説明**: フローの実行順序です。値が小さいほど先に実行されます。

負の数を使用して、複数のフローの実行順序を制御することもできます。

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

トリガーイベント名（文字列または `{ eventName }`）の宣言と、オプションの実行タイミング（`phase`）の指定に使用します。ハンドラー関数は含まれません（処理ロジックは `steps` に記述します）。

**サポートされているイベントタイプ**:
- `'beforeRender'` - 描画前イベント、コンポーネント初回描画時に自動トリガー
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

#### 実行タイミング（phase）

同じイベント（例えば `click`）に対して複数のイベントフローが存在する場合、`phase / flowKey / stepKey` を使用して、そのフローを組み込み静的フローのどの位置に挿入して実行するかを指定できます：

| phase | 意味 | 必要なフィールド |
| --- | --- | --- |
| `beforeAllFlows`（デフォルト） | すべての組み込み静的フローの前に実行 | - |
| `afterAllFlows` | すべての組み込み静的フローの後に実行 | - |
| `beforeFlow` | 特定の組み込み静的フローの開始前に実行 | `flowKey` |
| `afterFlow` | 特定の組み込み静的フローの終了後に実行 | `flowKey` |
| `beforeStep` | 特定の組み込み静的フローの特定の step の開始前に実行 | `flowKey` + `stepKey` |
| `afterStep` | 特定の組み込み静的フローの特定の step の終了後に実行 | `flowKey` + `stepKey` |

**例**：

```ts
// 1) デフォルト：すべての組み込み静的フローの前（phase の指定不要）
on: { eventName: 'click' }

// 2) すべての組み込み静的フローの後
on: { eventName: 'click', phase: 'afterAllFlows' }

// 3) 特定の組み込み静的フローの開始前 / 終了後
on: { eventName: 'click', phase: 'beforeFlow', flowKey: 'buttonSettings' }
on: { eventName: 'click', phase: 'afterFlow', flowKey: 'buttonSettings' }

// 4) 特定の組み込み静的フローの特定ステップの開始前 / 終了後
on: { eventName: 'click', phase: 'beforeStep', flowKey: 'buttonSettings', stepKey: 'general' }
on: { eventName: 'click', phase: 'afterStep', flowKey: 'buttonSettings', stepKey: 'general' }
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

モデルのインスタンス化（createModel）時に、「現在のフロー」のステップパラメーターに初期値を設定します。不足している値の補完のみを行い、既存の値は上書きしません。固定の戻り値の形式は `{ [stepKey]: params }` です。

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
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
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
