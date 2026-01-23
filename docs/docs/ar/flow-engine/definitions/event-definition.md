:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# EventDefinition

يُعرّف EventDefinition منطق معالجة الأحداث ضمن سير العمل، ويُستخدم للاستجابة لمُشغّلات أحداث مُحدّدة. تُعد الأحداث آلية مهمة في محرك سير العمل لتشغيل تنفيذ سير العمل.

## تعريف النوع

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

يُعد EventDefinition في الواقع اسمًا مستعارًا لـ ActionDefinition، وبالتالي فهو يمتلك نفس الخصائص والأساليب.

## طريقة التسجيل

```ts
// تسجيل عام (عبر FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // منطق معالجة الحدث
  }
});

// تسجيل على مستوى النموذج (عبر FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // منطق معالجة الحدث
  }
});

// الاستخدام في سير العمل
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // الإشارة إلى حدث مسجل
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## وصف الخصائص

### name

**النوع**: `string`  
**مطلوب**: نعم  
**الوصف**: المعرّف الفريد للحدث.

يُستخدم للإشارة إلى الحدث في سير العمل عبر الخاصية `on`.

**مثال**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**النوع**: `string`  
**مطلوب**: لا  
**الوصف**: عنوان العرض للحدث.

يُستخدم للعرض في واجهة المستخدم ولأغراض التصحيح.

**مثال**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**النوع**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**مطلوب**: نعم  
**الوصف**: دالة المعالجة للحدث.

المنطق الأساسي للحدث، يستقبل السياق والمعاملات، ويعيد نتيجة المعالجة.

**مثال**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // تنفيذ منطق معالجة الحدث
    const result = await handleEvent(params);
    
    // إعادة النتيجة
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

**النوع**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**مطلوب**: لا  
**الوصف**: المعاملات الافتراضية للحدث.

تُستخدم لملء المعاملات بقيم افتراضية عند تشغيل الحدث.

**مثال**:
```ts
// معاملات افتراضية ثابتة
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// معاملات افتراضية ديناميكية
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// معاملات افتراضية غير متزامنة
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**النوع**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**مطلوب**: لا  
**الوصف**: مخطط تهيئة واجهة المستخدم (UI) للحدث.

يُعرّف طريقة عرض الحدث وتهيئة النموذج في واجهة المستخدم.

**مثال**:
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

**النوع**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**مطلوب**: لا  
**الوصف**: دالة ربط تُنفّذ قبل حفظ المعاملات.

تُنفّذ قبل حفظ معاملات الحدث، ويمكن استخدامها للتحقق من صحة المعاملات أو تحويلها.

**مثال**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // التحقق من صحة المعاملات
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // تحويل المعاملات
  params.eventType = params.eventType.toLowerCase();
  
  // تسجيل التغييرات
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**النوع**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**مطلوب**: لا  
**الوصف**: دالة ربط تُنفّذ بعد حفظ المعاملات.

تُنفّذ بعد حفظ معاملات الحدث، ويمكن استخدامها لتشغيل عمليات أخرى.

**مثال**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // تسجيل السجل
  console.log('Event params saved:', params);
  
  // تشغيل الحدث
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // تحديث الذاكرة المؤقتة
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**النوع**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**مطلوب**: لا  
**الوصف**: وضع عرض واجهة المستخدم (UI) للحدث.

يتحكم في كيفية عرض الحدث في واجهة المستخدم.

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
    width: 600,
    title: 'Event Configuration'
  }
}

// وضع ديناميكي
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## أنواع الأحداث المدمجة

يحتوي محرك سير العمل على أنواع الأحداث الشائعة التالية المدمجة:

- `'click'` - حدث النقر
- `'submit'` - حدث الإرسال
- `'reset'` - حدث إعادة الضبط
- `'remove'` - حدث الحذف
- `'openView'` - حدث فتح العرض
- `'dropdownOpen'` - حدث فتح القائمة المنسدلة
- `'popupScroll'` - حدث تمرير النافذة المنبثقة
- `'search'` - حدث البحث
- `'customRequest'` - حدث الطلب المخصص
- `'collapseToggle'` - حدث تبديل الطي

## مثال كامل

```ts
class FormModel extends FlowModel {}

// تسجيل حدث إرسال النموذج
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // التحقق من صحة بيانات النموذج
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // معالجة إرسال النموذج
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

// تسجيل حدث تغيير البيانات
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // تسجيل تغيير البيانات
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // تشغيل الإجراءات ذات الصلة
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

// استخدام الأحداث في سير العمل
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