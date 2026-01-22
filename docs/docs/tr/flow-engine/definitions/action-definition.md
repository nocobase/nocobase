:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# ActionDefinition

ActionDefinition, birden fazla iş akışında ve adımda referans alınabilen, yeniden kullanılabilir eylemleri tanımlar. Bir eylem, iş akışı motorundaki temel yürütme birimidir ve belirli iş mantığını kapsüller.

## Tip Tanımı

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

## Kayıt Yöntemi

```ts
// Global kayıt (FlowEngine aracılığıyla)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // İşleme mantığı
  }
});

// Model düzeyinde kayıt (FlowModel aracılığıyla)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // İşleme mantığı
  }
});

// Bir iş akışında kullanma
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Global eylemi referans alma
    },
    step2: {
      use: 'processDataAction', // Model düzeyindeki eylemi referans alma
    }
  }
});
```

## Özellik Açıklamaları

### name

**Tip**: `string`  
**Gerekli**: Evet  
**Açıklama**: Eylemin benzersiz tanımlayıcısı

Bir adımda eylemi `use` özelliği aracılığıyla referans almak için kullanılır.

**Örnek**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Tip**: `string`  
**Gerekli**: Hayır  
**Açıklama**: Eylemin görünen başlığı

Kullanıcı arayüzünde görüntüleme ve hata ayıklama için kullanılır.

**Örnek**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**Tip**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Gerekli**: Evet  
**Açıklama**: Eylemin işleyici fonksiyonu

Eylemin temel mantığıdır; bağlamı ve parametreleri alır, işleme sonucunu döndürür.

**Örnek**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Belirli mantığı yürütün
    const result = await performAction(params);
    
    // Sonucu döndürün
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

**Tip**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Gerekli**: Hayır  
**Açıklama**: Eylemin varsayılan parametreleri

Eylem yürütülmeden önce parametreleri varsayılan değerlerle doldurur.

**Örnek**:
```ts
// Statik varsayılan parametreler
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Dinamik varsayılan parametreler
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Asenkron varsayılan parametreler
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

**Tip**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Gerekli**: Hayır  
**Açıklama**: Eylemin UI yapılandırma şeması

Eylemin kullanıcı arayüzünde nasıl görüntüleneceğini ve form yapılandırmasını tanımlar.

**Örnek**:
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
      title: 'HTTP Yöntemi',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Zaman Aşımı (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**Tip**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Gerekli**: Hayır  
**Açıklama**: Parametreler kaydedilmeden önceki kanca fonksiyonu

Eylem parametreleri kaydedilmeden önce yürütülür; parametre doğrulama veya dönüştürme için kullanılabilir.

**Örnek**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parametre doğrulama
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // Parametre dönüştürme
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Değişiklikleri kaydet
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Tip**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Gerekli**: Hayır  
**Açıklama**: Parametreler kaydedildikten sonraki kanca fonksiyonu

Eylem parametreleri kaydedildikten sonra yürütülür; diğer işlemleri tetiklemek için kullanılabilir.

**Örnek**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Günlük kaydet
  console.log('Action params saved:', params);
  
  // Olayı tetikle
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Önbelleği güncelle
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Tip**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Gerekli**: Hayır  
**Açıklama**: Ham parametrelerin kullanılıp kullanılmayacağı

Eğer `true` ise, ham parametreler herhangi bir işlem yapılmadan doğrudan işleyici fonksiyona iletilir.

**Örnek**:
```ts
// Statik yapılandırma
useRawParams: true

// Dinamik yapılandırma
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Tip**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Gerekli**: Hayır  
**Açıklama**: Eylemin UI görüntüleme modu

Eylemin kullanıcı arayüzünde nasıl görüntüleneceğini kontrol eder.

**Desteklenen modlar**:
- `'dialog'` - Diyalog modu
- `'drawer'` - Çekmece modu
- `'embed'` - Gömülü mod
- veya özel bir yapılandırma nesnesi

**Örnek**:
```ts
// Basit mod
uiMode: 'dialog'

// Özel yapılandırma
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Eylem Yapılandırması',
    maskClosable: false
  }
}

// Dinamik mod
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Tip**: `ActionScene | ActionScene[]`  
**Gerekli**: Hayır  
**Açıklama**: Eylemin kullanım senaryoları

Eylemin yalnızca belirli senaryolarda kullanılmasını kısıtlar.

**Desteklenen senaryolar**:
- `'settings'` - Ayarlar senaryosu
- `'runtime'` - Çalışma zamanı senaryosu
- `'design'` - Tasarım zamanı senaryosu

**Örnek**:
```ts
scene: 'settings'  // Yalnızca ayarlar senaryosunda kullanın
scene: ['settings', 'runtime']  // Ayarlar ve çalışma zamanı senaryolarında kullanın
```

### sort

**Tip**: `number`  
**Gerekli**: Hayır  
**Açıklama**: Eylemin sıralama ağırlığı

Eylemin bir listedeki görüntülenme sırasını kontrol etmek için kullanılır; değer ne kadar küçükse, o kadar önde yer alır.

**Örnek**:
```ts
sort: 0  // En önde
sort: 10 // Orta konum
sort: 100 // Daha arkada
```

## Tam Örnek

```ts
class DataProcessingModel extends FlowModel {}

// Veri yükleme eylemini kaydet
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Veri Yükle',
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
        title: 'HTTP Yöntemi',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Zaman Aşımı (ms)',
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

// Veri işleme eylemini kaydet
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Veriyi İşle',
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
        title: 'İşleyici',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Seçenekler',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Biçim',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Kodlama',
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