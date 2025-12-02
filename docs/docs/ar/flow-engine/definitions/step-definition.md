:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# تعريف الخطوة (StepDefinition)

تعرّف الخطوة (StepDefinition) خطوة فردية ضمن سير العمل (flow). يمكن أن تكون كل خطوة عبارة عن إجراء، أو معالجة حدث، أو عملية أخرى. الخطوة هي الوحدة التنفيذية الأساسية لسير العمل.

## تعريف النوع

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

## طريقة الاستخدام

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
        // منطق معالجة مخصص
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## وصف الخصائص

### key

**النوع**: `string`  
**مطلوب**: لا  
**الوصف**: المعرّف الفريد للخطوة ضمن سير العمل.

إذا لم يتم توفيره، فسيتم استخدام اسم المفتاح الخاص بالخطوة في كائن `steps`.

**مثال**:
```ts
steps: {
  loadData: {  // المفتاح هو 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**النوع**: `string`  
**مطلوب**: لا  
**الوصف**: اسم `ActionDefinition` مسجل لاستخدامه.

تتيح لك خاصية `use` الإشارة إلى إجراء مسجل، مما يجنبك التعريفات المكررة.

**مثال**:
```ts
// سجل الإجراء أولاً
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // منطق تحميل البيانات
  }
});

// استخدمه في الخطوة
steps: {
  step1: {
    use: 'loadDataAction',  // يشير إلى الإجراء المسجل
    title: 'Load Data'
  }
}
```

### title

**النوع**: `string`  
**مطلوب**: لا  
**الوصف**: عنوان عرض الخطوة.

يُستخدم للعرض في واجهة المستخدم ولأغراض التصحيح.

**مثال**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**النوع**: `number`  
**مطلوب**: لا  
**الوصف**: ترتيب تنفيذ الخطوة. كلما كانت القيمة أصغر، كلما تم تنفيذها أبكر.

يُستخدم للتحكم في ترتيب تنفيذ خطوات متعددة ضمن نفس سير العمل.

**مثال**:
```ts
steps: {
  step1: { sort: 0 },  // يُنفذ أولاً
  step2: { sort: 1 },  // يُنفذ تالياً
  step3: { sort: 2 }   // يُنفذ أخيراً
}
```

### handler

**النوع**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**مطلوب**: لا  
**الوصف**: دالة المعالجة للخطوة.

عند عدم استخدام خاصية `use`، يمكنك تعريف دالة المعالجة مباشرةً.

**مثال**:
```ts
handler: async (ctx, params) => {
  // احصل على معلومات السياق
  const { model, flowEngine } = ctx;
  
  // منطق المعالجة
  const result = await processData(params);
  
  // أعد النتيجة
  return { success: true, data: result };
}
```

### defaultParams

**النوع**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**مطلوب**: لا  
**الوصف**: المعلمات الافتراضية للخطوة.

تُستخدم لملء المعلمات بقيم افتراضية قبل تنفيذ الخطوة.

**مثال**:
```ts
// معلمات افتراضية ثابتة
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// معلمات افتراضية ديناميكية
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// معلمات افتراضية غير متزامنة
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**النوع**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**مطلوب**: لا  
**الوصف**: مخطط تهيئة واجهة المستخدم (UI) للخطوة.

يحدد كيفية عرض الخطوة في الواجهة وتكوين نموذجها.

**مثال**:
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

**النوع**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**مطلوب**: لا  
**الوصف**: دالة ربط (hook) تُنفذ قبل حفظ المعلمات.

تُنفذ قبل حفظ معلمات الخطوة، ويمكن استخدامها للتحقق من المعلمات أو تحويلها.

**مثال**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // التحقق من المعلمات
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // تحويل المعلمات
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**النوع**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**مطلوب**: لا  
**الوصف**: دالة ربط (hook) تُنفذ بعد حفظ المعلمات.

تُنفذ بعد حفظ معلمات الخطوة، ويمكن استخدامها لتشغيل عمليات أخرى.

**مثال**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // سجل السجلات
  console.log('Step params saved:', params);
  
  // تشغيل عمليات أخرى
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**النوع**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**مطلوب**: لا  
**الوصف**: وضع عرض واجهة المستخدم (UI) للخطوة.

يتحكم في كيفية عرض الخطوة في الواجهة.

**الأوضاع المدعومة**:
- `'dialog'` - وضع الحوار
- `'drawer'` - وضع الدرج الجانبي
- `'embed'` - وضع التضمين
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
    title: 'Step Configuration'
  }
}

// وضع ديناميكي
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**النوع**: `boolean`  
**مطلوب**: لا  
**الوصف**: ما إذا كانت الخطوة مُعدة مسبقًا.

يجب ملء معلمات الخطوات التي تحمل `preset: true` عند الإنشاء. أما الخطوات التي لا تحمل هذه العلامة، فيمكن ملء معلَماتها بعد إنشاء النموذج.

**مثال**:
```ts
steps: {
  step1: {
    preset: true,  // يجب ملء المعلمات عند الإنشاء
    use: 'requiredAction'
  },
  step2: {
    preset: false, // يمكن ملء المعلمات لاحقًا
    use: 'optionalAction'
  }
}
```

### paramsRequired

**النوع**: `boolean`  
**مطلوب**: لا  
**الوصف**: ما إذا كانت معلمات الخطوة مطلوبة.

إذا كانت `true`، فسيتم فتح مربع حوار التهيئة قبل إضافة النموذج.

**مثال**:
```ts
paramsRequired: true  // يجب تهيئة المعلمات قبل إضافة النموذج
paramsRequired: false // يمكن تهيئة المعلمات لاحقًا
```

### hideInSettings

**النوع**: `boolean`  
**مطلوب**: لا  
**الوصف**: ما إذا كان سيتم إخفاء الخطوة في قائمة الإعدادات.

**مثال**:
```ts
hideInSettings: true  // إخفاء في الإعدادات
hideInSettings: false // إظهار في الإعدادات (افتراضي)
```

### isAwait

**النوع**: `boolean`  
**مطلوب**: لا  
**القيمة الافتراضية**: `true`  
**الوصف**: ما إذا كان يجب انتظار اكتمال دالة المعالجة.

**مثال**:
```ts
isAwait: true  // انتظار اكتمال دالة المعالجة (افتراضي)
isAwait: false // عدم الانتظار، تنفيذ غير متزامن
```

## مثال كامل

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