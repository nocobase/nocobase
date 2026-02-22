# EventDefinition

EventDefinition 定义了流中的事件处理逻辑，用于响应特定的事件触发。事件是流引擎中用于触发流执行的重要机制。

## 类型定义

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

EventDefinition 实际上是 ActionDefinition 的别名，因此具有相同的属性和方法。

## 注册方式

```ts
// 全局注册（通过 FlowEngine）
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // 事件处理逻辑
  }
});

// 模型级注册（通过 FlowModel）
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // 事件处理逻辑
  }
});

// 在流中使用
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // 引用已注册的事件
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## 属性说明

### name

**类型**: `string`  
**必需**: 是  
**描述**: 事件的唯一标识符

用于在流中通过 `on` 属性引用事件。

**示例**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**类型**: `string`  
**必需**: 否  
**描述**: 事件的显示标题

用于界面展示和调试。

**示例**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**类型**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**必需**: 是  
**描述**: 事件的处理函数

事件的核心逻辑，接收上下文和参数，返回处理结果。

**示例**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // 执行事件处理逻辑
    const result = await handleEvent(params);
    
    // 返回结果
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

**类型**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**必需**: 否  
**描述**: 事件的默认参数

在事件触发时，为参数填充默认值。

**示例**:
```ts
// 静态默认参数
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// 动态默认参数
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// 异步默认参数
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**类型**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**必需**: 否  
**描述**: 事件的 UI 配置模式

定义事件在界面中的显示方式和表单配置。

**示例**:
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

**类型**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**必需**: 否  
**描述**: 参数保存前的钩子函数

在事件参数保存前执行，可以用于参数验证或转换。

**示例**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // 参数验证
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // 参数转换
  params.eventType = params.eventType.toLowerCase();
  
  // 记录变更
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**类型**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**必需**: 否  
**描述**: 参数保存后的钩子函数

在事件参数保存后执行，可以用于触发其他操作。

**示例**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // 记录日志
  console.log('Event params saved:', params);
  
  // 触发事件
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // 更新缓存
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**类型**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**必需**: 否  
**描述**: 事件的 UI 显示模式

控制事件在界面中的显示方式。

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
    width: 600,
    title: 'Event Configuration'
  }
}

// 动态模式
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## 内置事件类型

流引擎内置了以下常用事件类型：

- `'click'` - 点击事件
- `'submit'` - 提交事件
- `'reset'` - 重置事件
- `'remove'` - 删除事件
- `'openView'` - 打开视图事件
- `'dropdownOpen'` - 下拉框打开事件
- `'popupScroll'` - 弹窗滚动事件
- `'search'` - 搜索事件
- `'customRequest'` - 自定义请求事件
- `'collapseToggle'` - 折叠切换事件

## 完整示例

```ts
class FormModel extends FlowModel {}

// 注册表单提交事件
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // 验证表单数据
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // 处理表单提交
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

// 注册数据变化事件
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // 记录数据变化
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // 触发相关操作
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

// 在流中使用事件
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
