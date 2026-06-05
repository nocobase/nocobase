:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# EventDefinition

EventDefinition は、特定のイベントトリガーに応答するために、フロー内のイベント処理ロジックを定義します。イベントは、フローの実行をトリガーする上で、フローエンジンにとって重要なメカニズムです。

## 型定義

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

EventDefinition は、実際には ActionDefinition のエイリアスであるため、同じプロパティとメソッドを持ちます。

## 登録方法

```ts
// グローバル登録（FlowEngine 経由）
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // イベント処理ロジック
  }
});

// モデルレベルの登録（FlowModel 経由）
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // イベント処理ロジック
  }
});

// フローでの使用
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // 登録済みのイベントを参照
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## プロパティの説明

### name

**型**: `string`  
**必須**: はい  
**説明**: イベントの一意な識別子です。

フロー内で `on` プロパティを使ってイベントを参照する際に使用します。

**例**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**型**: `string`  
**必須**: いいえ  
**説明**: イベントの表示タイトルです。

UI 表示やデバッグに使用されます。

**例**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**型**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**必須**: はい  
**説明**: イベントのハンドラー関数です。

イベントのコアロジックであり、コンテキストとパラメーターを受け取り、処理結果を返します。

**例**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // イベント処理ロジックを実行
    const result = await handleEvent(params);
    
    // 結果を返します
    return {
      success: true,
      data: result,
      message: 'Event handled successfully'
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
**説明**: イベントのデフォルトパラメーターです。

イベントがトリガーされた際に、パラメーターにデフォルト値を設定します。

**例**:
```ts
// 静的なデフォルトパラメーター
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// 動的なデフォルトパラメーター
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// 非同期のデフォルトパラメーター
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**型**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**必須**: いいえ  
**説明**: イベントの UI 設定スキーマです。

UI におけるイベントの表示方法やフォーム設定を定義します。

**例**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Prevent Default',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Stop Propagation',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Custom Data',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Key',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Value',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**型**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**必須**: いいえ  
**説明**: パラメーター保存前のフック関数です。

イベントパラメーターが保存される前に実行され、パラメーターの検証や変換に使用できます。

**例**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // パラメーターの検証
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // パラメーターの変換
  params.eventType = params.eventType.toLowerCase();
  
  // 変更をログに記録
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**型**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**必須**: いいえ  
**説明**: パラメーター保存後のフック関数です。

イベントパラメーターが保存された後に実行され、他の操作をトリガーするために使用できます。

**例**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // ログを記録
  console.log('Event params saved:', params);
  
  // イベントをトリガー
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // キャッシュを更新
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**型**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**必須**: いいえ  
**説明**: イベントの UI 表示モードです。

UI におけるイベントの表示方法を制御します。

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
    width: 600,
    title: 'Event Configuration'
  }
}

// 動的なモード
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## 組み込みイベントタイプ

フローエンジンには、以下の一般的なイベントタイプが組み込まれています。

- `'click'` - クリックイベント
- `'submit'` - 送信イベント
- `'reset'` - リセットイベント
- `'remove'` - 削除イベント
- `'openView'` - ビューを開くイベント
- `'dropdownOpen'` - ドロップダウンオープンイベント
- `'popupScroll'` - ポップアップスクロールイベント
- `'search'` - 検索イベント
- `'customRequest'` - カスタムリクエストイベント
- `'collapseToggle'` - 折りたたみ切り替えイベント

## 完全な例

```ts
class FormModel extends FlowModel {}

// フォーム送信イベントを登録
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // フォームデータを検証
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // フォーム送信を処理
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Form submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    validation: true,
    preventDefault: true,
    stopPropagation: false
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      validation: {
        type: 'boolean',
        title: 'Enable Validation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Prevent Default',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Stop Propagation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Custom Handlers',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Handler Name',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-component': 'Switch'
            }
          }
        }
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (params.validation && !params.formData) {
      throw new Error('Form data is required when validation is enabled');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// データ変更イベントを登録
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // データ変更をログに記録
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // 関連する操作をトリガー
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Data change logged successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    logLevel: 'info',
    notify: true,
    timestamp: Date.now()
  }),
  uiMode: 'embed'
});

// フローでイベントを使用
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Form Processing',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Validate Form',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Process Form',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Save Form',
      sort: 2
    }
  }
});
```