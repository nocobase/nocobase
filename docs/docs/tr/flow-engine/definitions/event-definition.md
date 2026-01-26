:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# EventDefinition

EventDefinition, bir iş akışındaki olay işleme mantığını tanımlar ve belirli olay tetikleyicilerine yanıt vermek için kullanılır. Olaylar, iş akışı motorunda iş akışı yürütmesini tetiklemek için önemli bir mekanizmadır.

## Tip Tanımı

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

EventDefinition aslında ActionDefinition'ın bir diğer adıdır (alias), bu nedenle aynı özelliklere ve yöntemlere sahiptir.

## Kayıt Yöntemi

```ts
// Global kayıt (FlowEngine aracılığıyla)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Olay işleme mantığı
  }
});

// Model düzeyinde kayıt (FlowModel aracılığıyla)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Olay işleme mantığı
  }
});

// Bir iş akışında kullanım
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Kayıtlı bir olaya referans verme
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Özellik Açıklamaları

### name

**Tip**: `string`  
**Gerekli**: Evet  
**Açıklama**: Olayın benzersiz tanımlayıcısıdır.

Bir iş akışında, `on` özelliği aracılığıyla olaya referans vermek için kullanılır.

**Örnek**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Tip**: `string`  
**Gerekli**: Hayır  
**Açıklama**: Olayın görüntülenme başlığıdır.

Kullanıcı arayüzünde (UI) görüntüleme ve hata ayıklama için kullanılır.

**Örnek**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Tip**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Gerekli**: Evet  
**Açıklama**: Olayın işleyici fonksiyonudur.

Olayın temel mantığını içerir; bağlamı (context) ve parametreleri alır, işleme sonucunu döndürür.

**Örnek**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Olay işleme mantığını yürütün
    const result = await handleEvent(params);
    
    // Sonucu döndürün
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

**Tip**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Gerekli**: Hayır  
**Açıklama**: Olay için varsayılan parametrelerdir.

Olay tetiklendiğinde, parametreleri varsayılan değerlerle doldurur.

**Örnek**:
```ts
// Statik varsayılan parametreler
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Dinamik varsayılan parametreler
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Asenkron varsayılan parametreler
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**Tip**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Gerekli**: Hayır  
**Açıklama**: Olayın kullanıcı arayüzü (UI) yapılandırma şemasıdır.

Olayın kullanıcı arayüzünde nasıl görüntüleneceğini ve form yapılandırmasını tanımlar.

**Örnek**:
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

**Tip**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Gerekli**: Hayır  
**Açıklama**: Parametreler kaydedilmeden önce yürütülen kanca fonksiyonudur.

Olay parametreleri kaydedilmeden önce çalışır; parametre doğrulama veya dönüştürme için kullanılabilir.

**Örnek**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parametre doğrulama
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // Parametre dönüştürme
  params.eventType = params.eventType.toLowerCase();
  
  // Değişiklikleri kaydetme
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Tip**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Gerekli**: Hayır  
**Açıklama**: Parametreler kaydedildikten sonra yürütülen kanca fonksiyonudur.

Olay parametreleri kaydedildikten sonra çalışır; diğer eylemleri tetiklemek için kullanılabilir.

**Örnek**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Loglama
  console.log('Event params saved:', params);
  
  // Olayı tetikleme
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Önbelleği güncelleme
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Tip**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Gerekli**: Hayır  
**Açıklama**: Olayın kullanıcı arayüzü (UI) görüntüleme modudur.

Olayın kullanıcı arayüzünde nasıl görüntüleneceğini kontrol eder.

**Desteklenen modlar**:
- `'dialog'` - Diyalog (pencere) modu
- `'drawer'` - Çekmece (yan panel) modu
- `'embed'` - Gömülü mod
- Veya özel bir yapılandırma nesnesi

**Örnek**:
```ts
// Basit mod
uiMode: 'dialog'

// Özel yapılandırma
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Event Configuration'
  }
}

// Dinamik mod
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Yerleşik Olay Tipleri

İş akışı motoru, aşağıdaki yaygın olay tiplerini yerleşik olarak sunar:

- `'click'` - Tıklama olayı
- `'submit'` - Gönderme olayı
- `'reset'` - Sıfırlama olayı
- `'remove'` - Kaldırma olayı
- `'openView'` - Görünüm açma olayı
- `'dropdownOpen'` - Açılır liste açma olayı
- `'popupScroll'` - Açılır pencere kaydırma olayı
- `'search'` - Arama olayı
- `'customRequest'` - Özel istek olayı
- `'collapseToggle'` - Daraltma/genişletme olayı

## Tam Örnek

```ts
class FormModel extends FlowModel {}

// Form gönderme olayını kaydedin
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Form verilerini doğrulayın
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // Form göndermeyi işleyin
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

// Veri değişikliği olayını kaydedin
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Veri değişikliğini kaydedin
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // İlgili eylemleri tetikleyin
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

// Bir iş akışında olayları kullanma
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