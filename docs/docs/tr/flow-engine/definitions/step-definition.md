:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# StepDefinition

StepDefinition, bir iş akışındaki tek bir adımı tanımlar. Her adım bir eylem, olay işleme veya başka bir işlem olabilir. Adım, bir iş akışının temel yürütme birimidir.

## Tip Tanımı

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

## Kullanım

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
        // Özel işleme mantığı
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Özellik Açıklamaları

### key

**Tip**: `string`  
**Zorunlu**: Hayır  
**Açıklama**: Adımın iş akışı içindeki benzersiz tanımlayıcısıdır.

Eğer bir `key` belirtmezseniz, `steps` nesnesindeki adımın anahtar adı kullanılır.

**Örnek**:
```ts
steps: {
  loadData: {  // 'loadData' anahtarı
    use: 'loadDataAction'
  }
}
```

### use

**Tip**: `string`  
**Zorunlu**: Hayır  
**Açıklama**: Kullanılacak kayıtlı bir ActionDefinition'ın adıdır.

`use` özelliği, kayıtlı bir eylemi referans almanızı sağlayarak tekrar tanımlama ihtiyacını ortadan kaldırır.

**Örnek**:
```ts
// Önce eylemi kaydedin
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Veri yükleme mantığı
  }
});

// Bir adımda kullanın
steps: {
  step1: {
    use: 'loadDataAction',  // Kayıtlı eylemi referans alın
    title: 'Load Data'
  }
}
```

### title

**Tip**: `string`  
**Zorunlu**: Hayır  
**Açıklama**: Adımın arayüzde gösterilecek başlığıdır.

Kullanıcı arayüzünde gösterim ve hata ayıklama amacıyla kullanılır.

**Örnek**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Tip**: `number`  
**Zorunlu**: Hayır  
**Açıklama**: Adımın yürütme sırasını belirler. Değer ne kadar küçükse, adım o kadar önce yürütülür.

Aynı iş akışındaki birden fazla adımın yürütme sırasını kontrol etmek için kullanılır.

**Örnek**:
```ts
steps: {
  step1: { sort: 0 },  // İlk yürütülür
  step2: { sort: 1 },  // Sonraki yürütülür
  step3: { sort: 2 }   // En son yürütülür
}
```

### handler

**Tip**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Zorunlu**: Hayır  
**Açıklama**: Adımın işleme fonksiyonudur.

`use` özelliği kullanılmadığında, işleme fonksiyonunu doğrudan burada tanımlayabilirsiniz.

**Örnek**:
```ts
handler: async (ctx, params) => {
  // Bağlam bilgilerini alın
  const { model, flowEngine } = ctx;
  
  // İşleme mantığı
  const result = await processData(params);
  
  // Sonucu döndürün
  return { success: true, data: result };
}
```

### defaultParams

**Tip**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Zorunlu**: Hayır  
**Açıklama**: Adım için varsayılan parametrelerdir.

Adım yürütülmeden önce parametreleri varsayılan değerlerle doldurur.

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
    timestamp: Date.now()
  }
}

// Asenkron varsayılan parametreler
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**Tip**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Zorunlu**: Hayır  
**Açıklama**: Adımın kullanıcı arayüzü (UI) yapılandırma şemasıdır.

Adımın arayüzde nasıl görüntüleneceğini ve form yapılandırmasını tanımlar.

**Örnek**:
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

**Tip**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Zorunlu**: Hayır  
**Açıklama**: Parametreler kaydedilmeden önce çalışan bir kanca fonksiyonudur.

Adım parametreleri kaydedilmeden önce çalışır; parametre doğrulama veya dönüştürme gibi işlemler için kullanabilirsiniz.

**Örnek**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parametre doğrulama
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Parametre dönüştürme
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Tip**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Zorunlu**: Hayır  
**Açıklama**: Parametreler kaydedildikten sonra çalışan bir kanca fonksiyonudur.

Adım parametreleri kaydedildikten sonra çalışır; diğer işlemleri tetiklemek için kullanabilirsiniz.

**Örnek**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Logları kaydedin
  console.log('Step params saved:', params);
  
  // Diğer işlemleri tetikleyin
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Tip**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Zorunlu**: Hayır  
**Açıklama**: Adımın kullanıcı arayüzü (UI) görüntüleme modunu belirler.

Adımın arayüzde nasıl görüntüleneceğini kontrol eder.

**Desteklenen modlar**:
- `'dialog'` - Diyalog modu
- `'drawer'` - Çekmece modu
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
    width: 800,
    title: 'Step Configuration'
  }
}

// Dinamik mod
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Tip**: `boolean`  
**Zorunlu**: Hayır  
**Açıklama**: Bu adımın önceden ayarlanmış (preset) bir adım olup olmadığını belirtir.

`preset: true` olarak işaretlenmiş adımların parametreleri oluşturulurken doldurulmalıdır. Bu işaretlemeye sahip olmayan adımların parametreleri ise model oluşturulduktan sonra da doldurulabilir.

**Örnek**:
```ts
steps: {
  step1: {
    preset: true,  // Oluşturma sırasında parametreler doldurulmalıdır
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Parametreler daha sonra doldurulabilir
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Tip**: `boolean`  
**Zorunlu**: Hayır  
**Açıklama**: Adım parametrelerinin zorunlu olup olmadığını belirtir.

Eğer `true` olarak ayarlanırsa, model eklenmeden önce bir yapılandırma iletişim kutusu açılır.

**Örnek**:
```ts
paramsRequired: true  // Model eklenmeden önce parametreler yapılandırılmalıdır
paramsRequired: false // Parametreler daha sonra yapılandırılabilir
```

### hideInSettings

**Tip**: `boolean`  
**Zorunlu**: Hayır  
**Açıklama**: Adımın ayarlar menüsünde gizlenip gizlenmeyeceğini kontrol eder.

**Örnek**:
```ts
hideInSettings: true  // Ayarlarda gizle
hideInSettings: false // Ayarlarda göster (varsayılan)
```

### isAwait

**Tip**: `boolean`  
**Zorunlu**: Hayır  
**Varsayılan**: `true`  
**Açıklama**: İşleyici fonksiyonunun tamamlanmasını bekleyip beklemeyeceğini belirtir.

**Örnek**:
```ts
isAwait: true  // İşleyici fonksiyonunun tamamlanmasını bekler (varsayılan)
isAwait: false // Beklemez, asenkron olarak yürütülür
```

## Tam Örnek

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