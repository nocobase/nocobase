:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/flow-engine/flow-context) bakın.
:::

# Bağlam Sistemi Genel Bakış

NocoBase iş akışı motorunun bağlam sistemi, farklı kapsamlara karşılık gelen üç katmana ayrılır; makul kullanım, hizmetlerin, yapılandırmaların ve verilerin esnek paylaşımını ve izolasyonunu sağlayarak iş sürdürülebilirliğini ve ölçeklenebilirliğini artırır.

- **FlowEngineContext (Küresel Bağlam)**: Küresel olarak tektir, tüm modeller ve iş akışları erişebilir, küresel hizmetlerin ve yapılandırmaların vb. kaydedilmesi için uygundur.
- **FlowModelContext (Model Bağlamı)**: Model ağacı içinde bağlam paylaşımı için kullanılır, alt modeller otomatik olarak üst model bağlamına vekillik eder, aynı isimli geçersiz kılmaları destekler, model düzeyinde mantık ve veri izolasyonu için uygundur.
- **FlowRuntimeContext (İş Akışı Çalışma Zamanı Bağlamı)**: Her iş akışı yürütmesinde oluşturulur, tüm iş akışı yürütme döngüsü boyunca sürer, iş akışı içindeki veri aktarımı, değişken depolama ve çalışma durumu kaydı için uygundur. `mode: 'runtime' | 'settings'` olmak üzere iki modu destekler, bunlar sırasıyla çalışma zamanı ve yapılandırma moduna karşılık gelir.

Tüm `FlowEngineContext` (Küresel Bağlam), `FlowModelContext` (Model Bağlamı), `FlowRuntimeContext` (İş Akışı Çalışma Zamanı Bağlamı) vb., `FlowContext`'in alt sınıfları veya örnekleridir.

---

## 🗂️ Hiyerarşi Şeması

```text
FlowEngineContext (Küresel Bağlam)
│
├── FlowModelContext (Model Bağlamı)
│     ├── Alt FlowModelContext (Alt model)
│     │     ├── FlowRuntimeContext (İş Akışı Çalışma Zamanı Bağlamı)
│     │     └── FlowRuntimeContext (İş Akışı Çalışma Zamanı Bağlamı)
│     └── FlowRuntimeContext (İş Akışı Çalışma Zamanı Bağlamı)
│
├── FlowModelContext (Model Bağlamı)
│     └── FlowRuntimeContext (İş Akışı Çalışma Zamanı Bağlamı)
│
└── FlowModelContext (Model Bağlamı)
      ├── Alt FlowModelContext (Alt model)
      │     └── FlowRuntimeContext (İş Akışı Çalışma Zamanı Bağlamı)
      └── FlowRuntimeContext (İş Akışı Çalışma Zamanı Bağlamı)
```

- `FlowModelContext`, bir vekillik (delegate) mekanizması aracılığıyla `FlowEngineContext` özelliklerine ve yöntemlerine erişebilir, böylece küresel yetenek paylaşımı sağlanır.
- Alt modellerin `FlowModelContext`'i, bir vekillik (delegate) mekanizması aracılığıyla üst modelin bağlamına erişebilir (senkron ilişki) ve aynı isimli geçersiz kılmaları destekler.
- Asenkron üst-alt modeller, durum kirliliğini önlemek için bir vekillik (delegate) ilişkisi kurmaz.
- `FlowRuntimeContext` her zaman ilgili `FlowModelContext`'ine bir vekillik (delegate) mekanizması aracılığıyla erişir, ancak yukarıya geri gönderim yapmaz.

---

## 🧭 Çalışma Zamanı ve Yapılandırma Modu (mode)

`FlowRuntimeContext`, `mode` parametresiyle ayrılan iki modu destekler:

- `mode: 'runtime'` (Çalışma zamanı): İş akışının gerçek yürütme aşaması için kullanılır, özellikler ve yöntemler gerçek verileri döndürür. Örneğin:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Yapılandırma modu): İş akışı tasarım ve yapılandırma aşaması için kullanılır, özellik erişimi değişken şablon dizeleri döndürür, ifade ve değişken seçimini kolaylaştırır. Örneğin:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Bu çift modlu tasarım, hem çalışma zamanındaki veri kullanılabilirliğini garanti eder hem de yapılandırma sırasındaki değişken referanslarını ve ifade oluşturmayı kolaylaştırarak iş akışı motorunun esnekliğini ve kullanım kolaylığını artırır.

---

## 🤖 Araçlar/Büyük Modeller için Bağlam Bilgisi

Belirli senaryolarda (örneğin JS*Model'in RunJS kod düzenlemesi, AI kodlama), "çağıran tarafın" kodu yürütmeden şunları anlaması gerekir:

- Mevcut `ctx` altında hangi **statik yeteneklerin** (API belgeleri, parametreler, örnekler, belge bağlantıları vb.) olduğu
- Mevcut arayüzde/çalışma zamanında hangi **isteğe bağlı değişkenlerin** (örneğin "mevcut kayıt", "mevcut açılır pencere kaydı" gibi dinamik yapılar) olduğu
- Mevcut çalışma ortamının **küçük boyutlu anlık görüntüsü** (prompt için kullanılır)

### 1) `await ctx.getApiInfos(options?)` (Statik API Bilgisi)

### 2) `await ctx.getVarInfos(options?)` (Değişken Yapısı Bilgisi)

- `defineProperty(...).meta` (meta factory dahil) temel alınarak değişken yapısı oluşturulur
- `path` kırpma ve `maxDepth` derinlik kontrolünü destekler
- Sadece ihtiyaç duyulduğunda aşağı doğru genişler

Yaygın parametreler:

- `maxDepth`: Maksimum genişleme derinliği (varsayılan 3)
- `path: string | string[]`: Kırpma, sadece belirtilen yolun alt ağacını çıktı verir

### 3) `await ctx.getEnvInfos()` (Çalışma Zamanı Ortam Anlık Görüntüsü)

Düğüm yapısı (basitleştirilmiş):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Doğrudan await ctx.getVar(getVar) için kullanılabilir, "ctx." ile başlar
  value?: any; // Çözümlenmiş/serileştirilebilir statik değer
  properties?: Record<string, EnvNode>;
};
```