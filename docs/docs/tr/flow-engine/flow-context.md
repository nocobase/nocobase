
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Bağlam Sistemi Genel Bakış

NocoBase İş Akışı motorunun bağlam sistemi, her biri farklı bir kapsama alanına karşılık gelen üç katmana ayrılmıştır. Bu sistemi doğru kullanarak hizmetlerin, yapılandırmaların ve verilerin esnek bir şekilde paylaşılmasını ve yalıtılmasını sağlayabilir, böylece iş sürdürülebilirliğini ve ölçeklenebilirliğini artırabilirsiniz.

- **FlowEngineContext (Genel Bağlam)**: Küresel olarak benzersizdir ve tüm modeller ile iş akışları tarafından erişilebilir. Genel hizmetleri, yapılandırmaları vb. kaydetmek için uygundur.
- **FlowModelContext (Model Bağlamı)**: Bir model ağacı içinde bağlam paylaşımı için kullanılır. Alt modeller, üst modelin bağlamını otomatik olarak devralır ve aynı ada sahip öğelerin üzerine yazmayı destekler. Model düzeyinde mantık ve veri yalıtımı için uygundur.
- **FlowRuntimeContext (İş Akışı Çalışma Zamanı Bağlamı)**: Her iş akışı yürütüldüğünde oluşturulur ve tüm iş akışı yürütme döngüsü boyunca devam eder. İş akışı içindeki veri aktarımı, değişken depolama ve çalışma zamanı durumu kaydı için uygundur. `mode: 'runtime' | 'settings'` olmak üzere iki modu destekler; bunlar sırasıyla çalışma zamanı modu ve ayarlar moduna karşılık gelir.

Tüm `FlowEngineContext` (Genel Bağlam), `FlowModelContext` (Model Bağlamı), `FlowRuntimeContext` (İş Akışı Çalışma Zamanı Bağlamı) gibi yapılar, `FlowContext` sınıfının alt sınıfları veya örnekleridir.

---

## 🗂️ Hiyerarşi Şeması

```text
FlowEngineContext (Genel Bağlam)
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

- `FlowModelContext`, `FlowEngineContext`'in özelliklerine ve metotlarına bir vekil (delegate) mekanizması aracılığıyla erişebilir ve böylece genel yeteneklerin paylaşımını sağlar.
- Bir alt modelin `FlowModelContext`'i, bir vekil (delegate) mekanizması aracılığıyla üst modelin bağlamına (senkron ilişki) erişebilir ve aynı ada sahip öğelerin üzerine yazmayı destekler.
- Asenkron üst-alt modeller, durum kirliliğini önlemek için bir vekil (delegate) ilişkisi kurmaz.
- `FlowRuntimeContext` her zaman ilgili `FlowModelContext`'ine bir vekil (delegate) mekanizması aracılığıyla erişir, ancak değişiklikleri yukarı doğru yaymaz.

## 🧭 Çalışma Zamanı ve Ayarlar Modu (mode)

`FlowRuntimeContext`, `mode` parametresiyle ayrılan iki modu destekler:

- `mode: 'runtime'` (Çalışma zamanı modu): İş akışının fiili yürütme aşamasında kullanılır. Özellikler ve metotlar gerçek verileri döndürür. Örneğin:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Ayarlar modu): İş akışı tasarım ve yapılandırma aşamasında kullanılır. Özellik erişimi, ifade ve değişken seçimini kolaylaştıran bir değişken şablon dizesi döndürür. Örneğin:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Bu çift modlu tasarım, hem çalışma zamanında veri kullanılabilirliğini garanti eder hem de yapılandırma sırasında değişken referanslamayı ve ifade oluşturmayı kolaylaştırarak İş Akışı motorunun esnekliğini ve kullanılabilirliğini artırır.