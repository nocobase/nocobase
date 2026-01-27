# StepDefinition

StepDefinition 定义了流中的单个步骤，每个步骤可以是一个动作、事件处理或其他操作。步骤是流的基本执行单元。

## 类型定义

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

## 使用方式

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
        // 自定义处理逻辑
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## 属性说明

### key

**类型**: `string`  
**必需**: 否  
**描述**: 步骤在流中的唯一标识符

如果不提供，将使用步骤在 `steps` 对象中的键名。

**示例**:
```ts
steps: {
  loadData: {  // key 为 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**类型**: `string`  
**必需**: 否  
**描述**: 要使用的已注册 ActionDefinition 名称

通过 `use` 属性可以引用已注册的动作，避免重复定义。

**示例**:
```ts
// 先注册动作
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // 加载数据逻辑
  }
});

// 在步骤中使用
steps: {
  step1: {
    use: 'loadDataAction',  // 引用已注册的动作
    title: 'Load Data'
  }
}
```

### title

**类型**: `string`  
**必需**: 否  
**描述**: 步骤的显示标题

用于界面展示和调试。

**示例**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**类型**: `number`  
**必需**: 否  
**描述**: 步骤执行顺序，数值越小越先执行

用于控制同一流中多个步骤的执行顺序。

**示例**:
```ts
steps: {
  step1: { sort: 0 },  // 最先执行
  step2: { sort: 1 },  // 其次执行
  step3: { sort: 2 }   // 最后执行
}
```

### handler

**类型**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**必需**: 否  
**描述**: 步骤的处理函数

当不使用 `use` 属性时，可以直接定义处理函数。

**示例**:
```ts
handler: async (ctx, params) => {
  // 获取上下文信息
  const { model, flowEngine } = ctx;
  
  // 处理逻辑
  const result = await processData(params);
  
  // 返回结果
  return { success: true, data: result };
}
```

### defaultParams

**类型**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**必需**: 否  
**描述**: 步骤的默认参数

在步骤执行前，为参数填充默认值。

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
    timestamp: Date.now()
  }
}

// 异步默认参数
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**类型**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**必需**: 否  
**描述**: 步骤的 UI 配置模式

定义步骤在界面中的显示方式和表单配置。

**示例**:
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

**类型**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**必需**: 否  
**描述**: 参数保存前的钩子函数

在步骤参数保存前执行，可以用于参数验证或转换。

**示例**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // 参数验证
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // 参数转换
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**类型**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**必需**: 否  
**描述**: 参数保存后的钩子函数

在步骤参数保存后执行，可以用于触发其他操作。

**示例**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // 记录日志
  console.log('Step params saved:', params);
  
  // 触发其他操作
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**类型**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**必需**: 否  
**描述**: 步骤的 UI 显示模式

控制步骤在界面中的显示方式。

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
    title: 'Step Configuration'
  }
}

// 动态模式
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**类型**: `boolean`  
**必需**: 否  
**描述**: 是否为预设步骤

`preset: true` 的步骤参数需要在创建时填写，没有标记的可以创建模型后再填写。

**示例**:
```ts
steps: {
  step1: {
    preset: true,  // 创建时必须填写参数
    use: 'requiredAction'
  },
  step2: {
    preset: false, // 可以后续填写参数
    use: 'optionalAction'
  }
}
```

### paramsRequired

**类型**: `boolean`  
**必需**: 否  
**描述**: 步骤参数是否必需

如果为 `true`，在添加模型前会打开配置对话框。

**示例**:
```ts
paramsRequired: true  // 添加模型前必须配置参数
paramsRequired: false // 可以后续配置参数
```

### hideInSettings

**类型**: `boolean`  
**必需**: 否  
**描述**: 是否在设置菜单中隐藏步骤

**示例**:
```ts
hideInSettings: true  // 在设置中隐藏
hideInSettings: false // 在设置中显示（默认）
```

### isAwait

**类型**: `boolean`  
**必需**: 否  
**默认值**: `true`  
**描述**: 是否等待处理函数完成

**示例**:
```ts
isAwait: true  // 等待处理函数完成（默认）
isAwait: false // 不等待，异步执行
```

## 完整示例

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
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
      title: 'Process Data',
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
      title: 'Save Data',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Save Configuration'
        }
      }
    }
  }
});
```
