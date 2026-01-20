:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# تعريف الإجراء

يُعرّف تعريف الإجراء (ActionDefinition) الإجراءات القابلة لإعادة الاستخدام، والتي يمكن الرجوع إليها في عدة مسارات عمل وخطوات. الإجراء هو وحدة التنفيذ الأساسية في FlowEngine، ويغلف منطق العمل المحدد.

## تعريف النوع

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

## طريقة التسجيل

```ts
// التسجيل العام (عبر FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // منطق المعالجة
  }
});

// التسجيل على مستوى النموذج (عبر FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // منطق المعالجة
  }
});

// الاستخدام في سير العمل
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // الإشارة إلى الإجراء العام
    },
    step2: {
      use: 'processDataAction', // الإشارة إلى الإجراء على مستوى النموذج
    }
  }
});
```

## وصف الخصائص

### name

**النوع**: `string`  
**مطلوب**: نعم  
**الوصف**: المعرف الفريد للإجراء

يُستخدم للإشارة إلى الإجراء في خطوة ما عبر خاصية `use`.

**مثال**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**النوع**: `string`  
**مطلوب**: لا  
**الوصف**: عنوان العرض للإجراء

يُستخدم للعرض في واجهة المستخدم ولأغراض التصحيح.

**مثال**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**النوع**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**مطلوب**: نعم  
**الوصف**: دالة المعالجة للإجراء

تمثل المنطق الأساسي للإجراء، حيث تستقبل السياق والمعاملات، وتُعيد نتيجة المعالجة.

**مثال**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // تنفيذ منطق محدد
    const result = await performAction(params);
    
    // إرجاع النتيجة
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

**النوع**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**مطلوب**: لا  
**الوصف**: المعاملات الافتراضية للإجراء

تُستخدم لملء المعاملات بقيم افتراضية قبل تنفيذ الإجراء.

**مثال**:
```ts
// معاملات افتراضية ثابتة
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// معاملات افتراضية ديناميكية
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// معاملات افتراضية غير متزامنة
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

**النوع**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**مطلوب**: لا  
**الوصف**: مخطط تهيئة واجهة المستخدم (UI) للإجراء

يُحدد كيفية عرض الإجراء في واجهة المستخدم وتكوين النموذج الخاص به.

**مثال**:
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

**النوع**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**مطلوب**: لا  
**الوصف**: دالة الربط التي تُنفّذ قبل حفظ المعاملات

تُنفّذ قبل حفظ معاملات الإجراء، ويمكن استخدامها للتحقق من صحة المعاملات أو تحويلها.

**مثال**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // التحقق من صحة المعاملات
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // تحويل المعاملات
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // تسجيل التغييرات
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**النوع**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**مطلوب**: لا  
**الوصف**: دالة الربط التي تُنفّذ بعد حفظ المعاملات

تُنفّذ بعد حفظ معاملات الإجراء، ويمكن استخدامها لتشغيل عمليات أخرى.

**مثال**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // تسجيل السجلات
  console.log('Action params saved:', params);
  
  // تشغيل حدث
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // تحديث ذاكرة التخزين المؤقت
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**النوع**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**مطلوب**: لا  
**الوصف**: هل يجب استخدام المعاملات الخام؟

إذا كانت القيمة `true`، فسيتم تمرير المعاملات الخام مباشرة إلى دالة المعالجة دون أي معالجة.

**مثال**:
```ts
// تهيئة ثابتة
useRawParams: true

// تهيئة ديناميكية
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**النوع**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**مطلوب**: لا  
**الوصف**: وضع عرض واجهة المستخدم (UI) للإجراء

يتحكم في كيفية عرض الإجراء في واجهة المستخدم.

**الأوضاع المدعومة**:
- `'dialog'` - وضع الحوار (Dialog)
- `'drawer'` - وضع الدرج (Drawer)
- `'embed'` - وضع التضمين (Embed)
- أو كائن تهيئة مخصص

**مثال**:
```ts
// وضع بسيط
uiMode: 'dialog'

// تهيئة مخصصة
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// وضع ديناميكي
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**النوع**: `ActionScene | ActionScene[]`  
**مطلوب**: لا  
**الوصف**: سيناريوهات استخدام الإجراء

يُقيّد استخدام الإجراء في سيناريوهات محددة فقط.

**السيناريوهات المدعومة**:
- `'settings'` - سيناريو الإعدادات
- `'runtime'` - سيناريو وقت التشغيل
- `'design'` - سيناريو وقت التصميم

**مثال**:
```ts
scene: 'settings'  // يُستخدم فقط في سيناريو الإعدادات
scene: ['settings', 'runtime']  // يُستخدم في سيناريوهات الإعدادات ووقت التشغيل
```

### sort

**النوع**: `number`  
**مطلوب**: لا  
**الوصف**: وزن ترتيب الإجراء

يتحكم في ترتيب عرض الإجراء في القائمة، حيث تعني القيمة الأصغر موقعًا أعلى.

**مثال**:
```ts
sort: 0  // أعلى موقع
sort: 10 // موقع متوسط
sort: 100 // موقع أدنى
```

## مثال كامل

```ts
class DataProcessingModel extends FlowModel {}

// تسجيل إجراء تحميل البيانات
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

// تسجيل إجراء معالجة البيانات
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