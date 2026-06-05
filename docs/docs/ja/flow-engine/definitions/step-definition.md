:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# StepDefinition

「StepDefinition」は、フローにおける個々のステップを定義します。各ステップは、アクション、イベント処理、またはその他の操作として機能します。ステップはフローの基本的な実行単位です。

## タイプ定義

```ts
interface StepDefinition<TModel extends FlowModel = FlowModel>
  extends Partial<Omit<ActionDefinition<TModel, FlowRuntimeContext<TModel>>, 'name'>> {
  key?: string;
  isAwait?: boolean;
  use?: string;
  sort?: number;
  preset?: boolean;
  paramsRequired?: boolean;
  hideInSettings?: boolean;
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
}
```

## 使用方法

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // カスタム処理ロジック
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## 属性説明

### key

**タイプ**: `string`  
**必須**: 否  
**説明**: フロー内でステップを一意に識別するための識別子です。

提供されない場合、`steps` オブジェクト内のステップのキー名が使用されます。

**例**:
```ts
steps: {
  loadData: {  // キーは 'loadData' です
    use: 'loadDataAction'
  }
}
```

### use

**タイプ**: `string`  
**必須**: 否  
**説明**: 使用する登録済み ActionDefinition の名前です。

`use` 属性を使用すると、登録済みのアクションを参照でき、定義の重複を避けることができます。

**例**:
```ts
// まずアクションを登録します
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // データ読み込みロジック
  }
});

// ステップで使用します
steps: {
  step1: {
    use: 'loadDataAction',  // 登録済みのアクションを参照
    title: 'Load Data'
  }
}
```

### title

**タイプ**: `string`  
**必須**: 否  
**説明**: ステップの表示タイトルです。

UI表示やデバッグに使用されます。

**例**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**タイプ**: `number`  
**必須**: 否  
**説明**: ステップの実行順序です。値が小さいほど先に実行されます。

同じフロー内の複数のステップの実行順序を制御するために使用されます。

**例**:
```ts
steps: {
  step1: { sort: 0 },  // 最も先に実行
  step2: { sort: 1 },  // 次に実行
  step3: { sort: 2 }   // 最後に実行
}
```

### handler

**タイプ**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**必須**: 否  
**説明**: ステップのハンドラー関数です。

`use` 属性を使用しない場合、ハンドラー関数を直接定義できます。

**例**:
```ts
handler: async (ctx, params) => {
  // コンテキスト情報を取得
  const { model, flowEngine } = ctx;
  
  // 処理ロジック
  const result = await processData(params);
  
  // 結果を返します
  return { success: true, data: result };
}
```

### defaultParams

**タイプ**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**必須**: 否  
**説明**: ステップのデフォルトパラメーターです。

ステップが実行される前に、パラメーターにデフォルト値が設定されます。

**例**:
```ts
// 静的なデフォルトパラメーター
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// 動的なデフォルトパラメーター
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// 非同期のデフォルトパラメーター
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**タイプ**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**必須**: 否  
**説明**: ステップのUI設定スキーマです。

インターフェースでのステップの表示方法とフォーム設定を定義します。

**例**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Age',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**タイプ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**必須**: 否  
**説明**: パラメーター保存前に実行されるフック関数です。

ステップパラメーターが保存される前に実行され、パラメーターの検証や変換に使用できます。

**例**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // パラメーター検証
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // パラメーター変換
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**タイプ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**必須**: 否  
**説明**: パラメーター保存後に実行されるフック関数です。

ステップパラメーターが保存された後に実行され、他の操作をトリガーするために使用できます。

**例**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // ログを記録
  console.log('Step params saved:', params);
  
  // 他の操作をトリガー
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**タイプ**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**必須**: 否  
**説明**: ステップのUI表示モードです。

インターフェースでのステップの表示方法を制御します。

**サポートされているモード**:
- `'dialog'` - ダイアログモード
- `'drawer'` - ドロワーモード
- `'embed'` - 埋め込みモード
- またはカスタム設定オブジェクト

**例**:
```ts
// シンプルなモード
uiMode: 'dialog'

// カスタム設定
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// 動的なモード
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**タイプ**: `boolean`  
**必須**: 否  
**説明**: プリセットステップであるかどうかを示します。

`preset: true` のステップのパラメーターは、作成時に記入する必要があります。このフラグがないステップは、モデル作成後に記入できます。

**例**:
```ts
steps: {
  step1: {
    preset: true,  // 作成時にパラメーターを記入する必要があります
    use: 'requiredAction'
  },
  step2: {
    preset: false, // パラメーターは後で記入できます
    use: 'optionalAction'
  }
}
```

### paramsRequired

**タイプ**: `boolean`  
**必須**: 否  
**説明**: ステップパラメーターが必須であるかどうかを示します。

`true` の場合、モデルを追加する前に設定ダイアログが開きます。

**例**:
```ts
paramsRequired: true  // モデルを追加する前にパラメーターを設定する必要があります
paramsRequired: false // パラメーターは後で設定できます
```

### hideInSettings

**タイプ**: `boolean`  
**必須**: 否  
**説明**: 設定メニューでステップを非表示にするかどうかを示します。

**例**:
```ts
hideInSettings: true  // 設定で非表示
hideInSettings: false // 設定で表示（デフォルト）
```

### isAwait

**タイプ**: `boolean`  
**必須**: 否  
**デフォルト値**: `true`  
**説明**: ハンドラー関数の完了を待つかどうかを示します。

**例**:
```ts
isAwait: true  // ハンドラー関数の完了を待ちます（デフォルト）
isAwait: false // 待たずに非同期で実行
```

## 完全な例

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'データの読み込み',
      sort: 0,
      preset: true,
      paramsRequired: true,
      defaultParams: {
        source: 'api',
        timeout: 5000
      },
      uiMode: 'dialog'
    },
    processData: {
      handler: async (ctx, params) => {
        const data = await ctx.model.getData();
        return processData(data, params);
      },
      title: 'データの処理',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Processor is required');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'データの保存',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: '保存設定'
        }
      }
    }
  }
});
```