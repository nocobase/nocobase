:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# FlowDefinition

FlowDefinition, bir akışın temel yapısını ve yapılandırmasını tanımlar ve Akış Motoru'nun (FlowEngine) temel kavramlarından biridir. Akışın meta bilgilerini, tetikleme koşullarını, yürütme adımlarını vb. açıklar.

## Tip Tanımı

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

## Kayıt Yöntemi

```ts
class MyModel extends FlowModel {}

// Model sınıfı aracılığıyla bir akış kaydetme
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## Özellik Açıklamaları

### key

**Tip**: `string`  
**Gerekli**: Evet  
**Açıklama**: Akış için benzersiz tanımlayıcıdır.

Tutarlı bir `xxxSettings` adlandırma stili kullanmanız önerilir, örneğin:
- `pageSettings`
- `tableSettings`
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

Bu adlandırma kuralı, tanımlamayı ve bakımı kolaylaştırır; proje genelinde tutarlı bir şekilde kullanılması tavsiye edilir.

**Örnek**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Tip**: `string`  
**Gerekli**: Hayır  
**Açıklama**: Akışın insanlar tarafından okunabilir başlığıdır.

`key` ile tutarlı bir stil koruyarak `Xxx settings` adlandırması kullanmanız önerilir, örneğin:
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

Bu adlandırma kuralı daha net ve anlaşılması kolaydır, kullanıcı arayüzü gösterimini ve ekip işbirliğini kolaylaştırır.

**Örnek**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Tip**: `boolean`  
**Gerekli**: Hayır  
**Varsayılan**: `false`  
**Açıklama**: Akışın yalnızca manuel olarak yürütülüp yürütülemeyeceğini belirtir.

- `true`: Akış yalnızca manuel olarak tetiklenebilir ve otomatik olarak yürütülmez.
- `false`: Akış otomatik olarak yürütülebilir (`on` özelliği mevcut olmadığında varsayılan olarak otomatik yürütülür).

**Örnek**:
```ts
manual: true  // Yalnızca manuel yürüt
manual: false // Otomatik olarak yürütülebilir
```

### sort

**Tip**: `number`  
**Gerekli**: Hayır  
**Varsayılan**: `0`  
**Açıklama**: Akışın yürütme sırasıdır. Değer ne kadar küçükse, akış o kadar önce yürütülür.

Birden fazla akışın yürütme sırasını kontrol etmek için negatif sayılar kullanabilirsiniz.

**Örnek**:
```ts
sort: -1  // Öncelikli yürüt
sort: 0   // Varsayılan sıra
sort: 1   // Daha sonra yürüt
```

### on

**Tip**: `FlowEvent<TModel>`  
**Gerekli**: Hayır  
**Açıklama**: Bu akışın `dispatchEvent` tarafından tetiklenmesine izin veren olay yapılandırmasıdır.

Yalnızca tetikleyici olay adını (dize veya `{ eventName }`) bildirmek için kullanılır, bir işleyici fonksiyon içermez.

**Desteklenen olay türleri**:
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
- Veya herhangi bir özel dize

**Örnek**:
```ts
on: 'click'  // Tıklandığında tetiklenir
on: 'submit' // Gönderildiğinde tetiklenir
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Tip**: `Record<string, StepDefinition<TModel>>`  
**Gerekli**: Evet  
**Açıklama**: Akışın adımlarının tanımıdır.

Akışta yer alan tüm adımları tanımlar; her adımın benzersiz bir anahtarı vardır.

**Örnek**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**Tip**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Gerekli**: Hayır  
**Açıklama**: Akış düzeyinde varsayılan parametrelerdir.

Model örneklendiğinde (`createModel`), "mevcut akışın" adım parametreleri için başlangıç değerlerini doldurur. Yalnızca eksik değerleri tamamlar, mevcut olanların üzerine yazmaz. Sabit dönüş şekli şöyledir: `{ [stepKey]: params }`

**Örnek**:
```ts
// Statik varsayılan parametreler
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Dinamik varsayılan parametreler
defaultParams: (ctx) => {
  return {
    step1: {
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Asenkron varsayılan parametreler
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Tam Örnek

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction',
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data',
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: {
      source: 'api',
      cache: true
    },
    processData: {
      format: 'json'
    }
  }
});
```