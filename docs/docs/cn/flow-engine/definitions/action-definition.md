# ActionDefinition

ActionDefinition 定义了可重用的动作，这些动作可以在多个流和步骤中被引用。动作是流引擎中的核心执行单元，封装了具体的业务逻辑。

## 类型定义

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

## 注册方式

```ts
// 全局注册（通过 FlowEngine）
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // 处理逻辑
  }
});

// 模型级注册（通过 FlowModel）
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // 处理逻辑
  }
});

// 在流中使用
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // 引用全局动作
    },
    step2: {
      use: 'processDataAction', // 引用模型级动作
    }
  }
});
```

## 属性说明

### name

**类型**: `string`  
**必需**: 是  
**描述**: 动作的唯一标识符

用于在步骤中通过 `use` 属性引用动作。

**示例**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**类型**: `string`  
**必需**: 否  
**描述**: 动作的显示标题

用于界面展示和调试。

**示例**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**类型**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**必需**: 是  
**描述**: 动作的处理函数

动作的核心逻辑，接收上下文和参数，返回处理结果。

**示例**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // 执行具体逻辑
    const result = await performAction(params);
    
    // 返回结果
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

**类型**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**必需**: 否  
**描述**: 动作的默认参数

在动作执行前，为参数填充默认值。

**示例**:
```ts
// 静态默认参数
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// 动态默认参数
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// 异步默认参数
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

**类型**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**必需**: 否  
**描述**: 动作的 UI 配置模式

定义动作在界面中的显示方式和表单配置。

**示例**:
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

**类型**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**必需**: 否  
**描述**: 参数保存前的钩子函数

在动作参数保存前执行，可以用于参数验证或转换。

**示例**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // 参数验证
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // 参数转换
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // 记录变更
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**类型**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**必需**: 否  
**描述**: 参数保存后的钩子函数

在动作参数保存后执行，可以用于触发其他操作。

**示例**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // 记录日志
  console.log('Action params saved:', params);
  
  // 触发事件
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // 更新缓存
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**类型**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**必需**: 否  
**描述**: 是否使用原始参数

如果为 `true`，将直接传递原始参数给处理函数，不进行任何处理。

**示例**:
```ts
// 静态配置
useRawParams: true

// 动态配置
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**类型**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**必需**: 否  
**描述**: 动作的 UI 显示模式

控制动作在界面中的显示方式。

**支持的模式**:
- `'dialog'` - 对话框模式
- `'drawer'` - 抽屉模式
- `'embed'` - 嵌入模式
- 或自定义配置对象

**示例**:
```ts
// 简单模式
uiMode: 'dialog'

// 自定义配置
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// 动态模式
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**类型**: `ActionScene | ActionScene[]`  
**必需**: 否  
**描述**: 动作的使用场景

限制动作在特定场景下使用。

**支持的场景**:
- `'settings'` - 设置场景
- `'runtime'` - 运行时场景
- `'design'` - 设计时场景

**示例**:
```ts
scene: 'settings'  // 仅在设置场景使用
scene: ['settings', 'runtime']  // 在设置和运行时场景使用
```

### sort

**类型**: `number`  
**必需**: 否  
**描述**: 动作的排序权重

用于控制动作在列表中的显示顺序，数值越小越靠前。

**示例**:
```ts
sort: 0  // 最靠前
sort: 10 // 中等位置
sort: 100 // 较靠后
```

## 完整示例

```ts
class DataProcessingModel extends FlowModel {}

// 注册数据加载动作
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

// 注册数据处理动作
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
