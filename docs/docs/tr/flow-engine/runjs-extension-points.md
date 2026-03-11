:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/flow-engine/runjs-extension-points) bakın.
:::

# RunJS Eklenti Genişletme Noktaları (ctx Dokümantasyonu / Snippet'ler / Senaryo Eşleme)

Bir eklenti RunJS yeteneklerini eklediğinde veya genişlettiğinde, "bağlam eşleme / `ctx` dokümantasyonu / örnek kod" bilgilerini **resmi genişletme noktaları** aracılığıyla kaydetmeniz önerilir. Bu sayede:

- CodeEditor, `ctx.xxx.yyy` için otomatik tamamlamayı (auto-completion) sağlayabilir.
- Yapay zeka ile kodlama (AI coding), yapılandırılmış `ctx` API referanslarını ve örneklerini alabilir.

Bu bölümde iki genişletme noktası tanıtılmaktadır:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

RunJS "katkılarını" (contributions) kaydetmek için kullanılır. Tipik kullanım durumları şunlardır:

- `RunJSContextRegistry` eşlemelerini eklemek veya üzerine yazmak (`modelClass` -> `RunJSContext`, `scenes` dahil).
- `FlowRunJSContext` veya özel bir `RunJSContext` için `RunJSDocMeta` ( `ctx` API'si için açıklamalar/örnekler/tamamlama şablonları) genişletmek.

### Davranış Açıklaması

- Katkılar, `setupRunJSContexts()` aşamasında toplu olarak yürütülür.
- Eğer `setupRunJSContexts()` zaten tamamlanmışsa, **geç yapılan kayıtlar hemen bir kez yürütülür** (kurulumu yeniden çalıştırmaya gerek yoktur).
- Her katkı, her `RunJSVersion` için **en fazla bir kez** yürütülür.

### Örnek: JS ile Yazılabilir Bir Model Bağlamı Ekleme

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) ctx dokümantasyonu/tamamlama (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS bağlamı',
    properties: {
      myPlugin: {
        description: 'Eklentimin ad alanı',
        detail: 'object',
        properties: {
          hello: {
            description: 'Selam ver',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('Dünya')` },
          },
        },
      },
    },
  });

  // 2) model -> bağlam eşlemesi (scene, editör tamamlamasını/snippet filtrelemesini etkiler)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

RunJS için örnek kod parçacıklarını (snippets) kaydetmek için kullanılır. Bunlar şunlar için kullanılır:

- CodeEditor snippet tamamlama.
- Yapay zeka kodlaması için örnek/referans materyali (senaryo/sürüm/yerel ayara göre filtrelenebilir).

### Önerilen ref Adlandırması

Şu formatın kullanılması önerilir: `plugin/<eklentiAdı>/<konu>`, örneğin:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Çekirdek (core) sistemdeki `global/*` veya `scene/*` ad alanlarıyla çakışmalardan kaçının.

### Çakışma Stratejisi

- Varsayılan olarak, mevcut `ref` girişlerinin üzerine yazılmaz (hata fırlatmadan `false` döner).
- Açıkça üzerine yazmak için `{ override: true }` parametresini geçirin.

### Örnek: Bir Snippet Kaydetme

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Merhaba (Eklentim)',
    description: 'Eklentim için minimal örnek',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// Eklenti snippet'im
ctx.message.success('Eklentiden merhaba');
`,
  },
}));
```

## 3. En İyi Uygulamalar

- **Dokümantasyon + Snippet'lerin Katmanlı Bakımı**:
  - `RunJSDocMeta`: Açıklamalar/tamamlama şablonları (kısa, yapılandırılmış).
  - Snippet'ler: Uzun örnekler (yeniden kullanılabilir, senaryo/sürüme göre filtrelenebilir).
- **Aşırı Uzun Prompt'lardan Kaçının**: Örnekler kısa olmalıdır; "minimal çalıştırılabilir şablonlara" öncelik verin.
- **Senaryo Önceliği**: JS kodunuz öncelikle formlar veya tablolar gibi senaryolarda çalışıyorsa, tamamlamaların ve örneklerin alakasını artırmak için `scenes` alanını doğru doldurduğunuzdan emin olun.

## 4. Gerçek ctx'e Göre Tamamlamaları Gizleme: `hidden(ctx)`

Bazı `ctx` API'leri yüksek derecede senaryoya özeldir (örneğin, `ctx.popup` yalnızca bir açılır pencere veya çekmece açık olduğunda kullanılabilir). Tamamlama sırasında bu kullanılamayan API'leri gizlemek isterseniz, `RunJSDocMeta` içindeki ilgili giriş için `hidden(ctx)` tanımlayabilirsiniz:

- `true` dönerse: Mevcut düğümü ve alt ağacını gizler.
- `string[]` dönerse: Mevcut düğüm altındaki belirli alt yolları gizler (birden fazla yol döndürmeyi destekler; yollar görelidir; alt ağaçlar önek eşleşmesine göre gizlenir).

`hidden(ctx)` asenkron (`async`) çalışmayı destekler: Görünürlüğü belirlemek için `await ctx.getVar('ctx.xxx')` kullanabilirsiniz. Bu mantığın hızlı ve yan etkisiz (örneğin ağ isteği yapmayan) tutulması önerilir.

Örnek: `ctx.popup.*` tamamlamalarını yalnızca `popup.uid` mevcut olduğunda göster.

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Açılır pencere bağlamı (asenkron)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup UID',
      },
    },
  },
});
```

Örnek: Açılır pencere mevcut ancak bazı alt yollar gizli (yalnızca göreli yollar; örneğin `record` ve `parent.record` gizleniyor).

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Açılır pencere bağlamı (asenkron)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup UID',
        record: 'Popup kaydı',
        parent: {
          properties: {
            record: 'Üst kayıt',
          },
        },
      },
    },
  },
});
```

Not: CodeEditor her zaman gerçek `ctx` değerine dayalı tamamlama filtrelemesini etkinleştirir (hata durumunda açık kalır, hata fırlatmaz).

## 5. Çalışma Zamanı `info/meta` ve Bağlam Bilgisi API'si (Tamamlamalar ve LLM'ler için)

`ctx` dokümantasyonunu `FlowRunJSContext.define()` aracılığıyla statik olarak sürdürmenin yanı sıra, çalışma zamanında `FlowContext.defineProperty/defineMethod` aracılığıyla **info/meta** enjekte edebilirsiniz. Ardından, CodeEditor veya LLM'ler (Büyük Dil Modelleri) tarafından kullanılmak üzere aşağıdaki API'leri kullanarak **serileştirilebilir** bağlam bilgilerini çıktı olarak alabilirsiniz:

- `await ctx.getApiInfos(options?)`: Statik API bilgileri.
- `await ctx.getVarInfos(options?)`: Değişken yapısı bilgileri (`meta` kaynaklıdır, yol/maxDepth genişletmesini destekler).
- `await ctx.getEnvInfos()`: Çalışma zamanı ortam anlık görüntüsü.

### 5.1 `defineMethod(name, fn, info?)`

`info` şunları destekler (tümü isteğe bağlıdır):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (JSDoc benzeri)

> Not: `getApiInfos()` statik API dokümantasyonu çıktısı verir ve `deprecated`, `disabled` veya `disabledReason` gibi alanları içermez.

Örnek: `ctx.refreshTargets()` için dokümantasyon bağlantıları sağlama.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Hedef blokların verilerini yeniler',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Dokümanlar' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Değişken seçici arayüzü (`getPropertyMetaTree` / `FlowContextSelector`) için kullanılır. Görünürlüğü, ağaç yapısını, devre dışı bırakma durumunu vb. belirler (fonksiyonları/asenkron yapıyı destekler).
  - Yaygın alanlar: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Statik API dokümantasyonu (`getApiInfos`) ve LLM'ler için açıklamalar için kullanılır. Değişken seçici arayüzünü etkilemez (fonksiyonları/asenkron yapıyı destekler).
  - Yaygın alanlar: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Yalnızca `meta` sağlandığında (`info` olmadan):

- `getApiInfos()` bu anahtarı döndürmez (çünkü statik API dokümanları `meta`dan çıkarılmaz).
- `getVarInfos()`, `meta`ya dayalı olarak değişken yapısını oluşturur (değişken seçiciler/dinamik değişken ağaçları için kullanılır).

### 5.3 Bağlam Bilgisi API'si

"Kullanılabilir bağlam yeteneği bilgilerini" çıktı olarak vermek için kullanılır.

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Doğrudan await ctx.getVar(getVar) içinde kullanılabilir, "ctx." ile başlaması önerilir
  value?: any; // Çözümlenmiş statik değer (serileştirilebilir, yalnızca çıkarılabildiğinde döndürülür)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Statik dokümantasyon (üst düzey)
type FlowContextVarInfos = Record<string, any>; // Değişken yapısı (yol/maxDepth ile genişletilebilir)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Yaygın parametreler:

- `getApiInfos({ version })`: RunJS dokümantasyon sürümü (varsayılan `v1`).
- `getVarInfos({ path, maxDepth })`: Kırpma ve maksimum genişletme derinliği (varsayılan 3).

Not: Yukarıdaki API'ler tarafından döndürülen sonuçlar fonksiyon içermez ve doğrudan LLM'lere serileştirilerek gönderilmeye uygundur.

### 5.4 `await ctx.getVar(path)`

Elinizde bir "değişken yolu dizesi" olduğunda (örneğin yapılandırmadan veya kullanıcı girişinden gelen) ve bu değişkenin çalışma zamanı değerini doğrudan almak istediğinizde `getVar` kullanın:

- Örnek: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path`, `ctx.` ile başlayan bir ifade yoludur (örneğin `ctx.record.id` / `ctx.record.roles[0].id`).

Ek olarak: Alt çizgi `_` ile başlayan metotlar veya özellikler özel (private) üyeler olarak kabul edilir ve `getApiInfos()` veya `getVarInfos()` çıktısında görünmezler.