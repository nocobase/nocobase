:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ActionDefinition

ActionDefinition は、複数のフローやステップで参照できる再利用可能なアクションを定義します。アクションは、フローエンジンにおける中心的な実行単位であり、具体的なビジネスロジックをカプセル化します。

## 型定義

```ts
interface ActionDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> {
  name: string;
  title?: string;
  handler: (ctx: TCtx, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>);
  beforeParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  afterParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  useRawParams?: boolean | ((ctx: TCtx) => boolean | Promise<boolean>);
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
  scene?: ActionScene | ActionScene[];
  sort?: number;
}
```

## 登録方法

```ts
// グローバル登録（FlowEngine 経由）
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // 処理ロジック
  }
});

// モデルレベルの登録（FlowModel 経由）
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // 処理ロジック
  }
});

// フローでの使用
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // グローバルアクションを参照
    },
    step2: {
      use: 'processDataAction', // モデルレベルのアクションを参照
    }
  }
});
```

## プロパティの説明

### name

**型**: `string`  
**必須**: はい  
**説明**: アクションの一意な識別子です

ステップで `use` プロパティを使ってアクションを参照するために使用します。

**例**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**型**: `string`  
**必須**: いいえ  
**説明**: アクションの表示タイトルです

UI 表示やデバッグに使用されます。

**例**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**型**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**必須**: はい  
**説明**: アクションのハンドラー関数です

アクションのコアロジックであり、コンテキストとパラメーターを受け取り、処理結果を返します。

**例**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // 具体的なロジックを実行
    const result = await performAction(params);
    
    // 結果を返す
    return {
      success: true,
      data: result,
      message: 'Action completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### defaultParams

**型**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**必須**: いいえ  
**説明**: アクションのデフォルトパラメーターです

アクション実行前に、パラメーターにデフォルト値を設定します。

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
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// 非同期のデフォルトパラメーター
defaultParams: async (ctx) => {
  const config = await loadConfiguration();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    timeout: config.timeout
  }
}
```

### uiSchema

**型**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**必須**: いいえ  
**説明**: アクションの UI 設定スキーマです

UI でのアクションの表示方法とフォーム設定を定義します。

**例**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  },
  properties: {
    url: {
      type: 'string',
      title: 'API URL',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'HTTP Method',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Timeout (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**型**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**必須**: いいえ  
**説明**: パラメーター保存前のフック関数です

アクションパラメーターの保存前に実行され、パラメーターの検証や変換に使用できます。

**例**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // パラメーターの検証
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // パラメーターの変換
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // 変更を記録
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**型**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**必須**: いいえ  
**説明**: パラメーター保存後のフック関数です

アクションパラメーターの保存後に実行され、他の操作をトリガーするために使用できます。

**例**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // ログを記録
  console.log('Action params saved:', params);
  
  // イベントをトリガー
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // キャッシュを更新
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**型**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**必須**: いいえ  
**説明**: 生のパラメーターを使用するかどうかです

もし `true` の場合、生のパラメーターは一切処理されずにハンドラー関数に直接渡されます。

**例**:
```ts
// 静的な設定
useRawParams: true

// 動的な設定
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**型**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**必須**: いいえ  
**説明**: アクションの UI 表示モードです

UI でのアクションの表示方法を制御します。

**サポートされるモード**:
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
    title: 'Action Configuration',
    maskClosable: false
  }
}

// 動的なモード
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**型**: `ActionScene | ActionScene[]`  
**必須**: いいえ  
**説明**: アクションの使用シーンです

特定シーンでのみアクションを使用するように制限します。

**サポートされるシーン**:
- `'settings'` - 設定シーン
- `'runtime'` - ランタイムシーン
- `'design'` - デザインタイムシーン

**例**:
```ts
scene: 'settings'  // 設定シーンでのみ使用
scene: ['settings', 'runtime']  // 設定およびランタイムシーンで使用
```

### sort

**型**: `number`  
**必須**: いいえ  
**説明**: アクションのソート順の重みです

リスト内でのアクションの表示順序を制御します。値が小さいほど上位に表示されます。

**例**:
```ts
sort: 0  // 最上位
sort: 10 // 中間の位置
sort: 100 // 下位
```

## 完全な例

```ts
class DataProcessingModel extends FlowModel {}

// データ読み込みアクションを登録
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    const { url, method = 'GET', timeout = 5000 } = params;
    
    try {
      const response = await fetch(url, {
        method,
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Data loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    method: 'GET',
    timeout: 5000
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      url: {
        type: 'string',
        title: 'API URL',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'HTTP Method',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Timeout (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('URL is required');
    }
    params.url = params.url.trim();
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('dataSourceChanged', params);
  },
  uiMode: 'dialog',
  scene: ['settings', 'runtime'],
  sort: 0
});

// データ処理アクションを登録
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Data processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    processor: 'default',
    options: {
      format: 'json',
      encoding: 'utf8'
    }
  }),
  uiSchema: {
    'x-component': 'Form',
    properties: {
      processor: {
        type: 'string',
        title: 'Processor',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Options',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Format',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Encoding',
            'x-component': 'Select',
            enum: ['utf8', 'ascii', 'latin1']
          }
        }
      }
    }
  },
  scene: 'runtime',
  sort: 1
});
```