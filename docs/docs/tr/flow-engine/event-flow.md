:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Olay Akışı

FlowEngine'de, arayüzdeki tüm bileşenler **olay odaklıdır**.
Bileşenlerin davranışları, etkileşimleri ve veri değişiklikleri olaylar tarafından tetiklenir ve bir akış aracılığıyla yürütülür.

## Statik Akış ve Dinamik Akış

FlowEngine'de, akışlar iki türe ayrılabilir:

### **1. Statik Akış (Static Flow)**

- Geliştiriciler tarafından kodda tanımlanır;
- Bir **Model sınıfının tüm örnekleri** üzerinde etki gösterir;
- Genellikle bir Model sınıfının genel mantığını işlemek için kullanılır;

### **2. Dinamik Akış (Dynamic Flow)**

- Kullanıcılar tarafından arayüzde yapılandırılır;
- Yalnızca belirli bir örnek için geçerlidir;
- Genellikle belirli senaryolarda kişiselleştirilmiş davranışlar için kullanılır;

Kısacası: **Statik akış, bir sınıf üzerinde tanımlanmış bir mantık şablonuyken, dinamik akış bir örnek üzerinde tanımlanmış kişiselleştirilmiş bir mantıktır.**

## İlişkilendirme Kuralları ve Dinamik Akış

FlowEngine'in yapılandırma sisteminde, olay mantığını uygulamanın iki yolu vardır:

### **1. İlişkilendirme Kuralları (Linkage Rules)**

- **Yerleşik olay akışı adımlarının kapsüllemeleridir**;
- Yapılandırması daha basittir ve daha anlamsaldır;
- Esasen, hala bir **olay akışının (Flow)** basitleştirilmiş bir biçimidir.

### **2. Dinamik Akış (Dynamic Flow)**

- Tam akış yapılandırma yetenekleri sunar;
- Özelleştirilebilir:
  - **Tetikleyici (on)**: Ne zaman tetikleneceğini tanımlar;
  - **Yürütme adımları (steps)**: Yürütülecek mantığı tanımlar;
- Daha karmaşık ve esnek iş mantığı için uygundur.

Bu nedenle, **İlişkilendirme Kuralları ≈ Basitleştirilmiş Olay Akışı** olup, her ikisinin de temel mekanizmaları tutarlıdır.

## FlowAction Tutarlılığı

Hem **İlişkilendirme Kuralları** hem de **Olay Akışları**, aynı **FlowAction** kümesini kullanmalıdır.
Yani:

- **FlowAction**, bir Akış tarafından çağrılabilecek eylemleri tanımlar;
- Her ikisi de ayrı ayrı iki sistem uygulamak yerine tek bir eylem sistemini paylaşır;
- Bu, mantık yeniden kullanımını ve tutarlı genişletmeyi sağlar.

## Kavramsal Hiyerarşi

Kavramsal olarak, FlowModel'in temel soyut ilişkisi aşağıdaki gibidir:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Küresel Olaylar
      │     └── Yerel Olaylar
      └── FlowActionDefinition
            ├── Küresel Eylemler
            └── Yerel Eylemler
```

### Hiyerarşi Açıklaması

- **FlowModel**  
  Yapılandırılabilir ve yürütülebilir akış mantığına sahip bir model varlığını temsil eder.

- **FlowDefinition**  
  Tetikleme koşulları ve yürütme adımları dahil olmak üzere eksiksiz bir akış mantığı kümesini tanımlar.

- **FlowEventDefinition**  
  Akışın tetikleme kaynağını tanımlar, bunlar şunları içerir:
  - **Küresel olaylar**: Uygulama başlangıcı, veri yükleme tamamlanması gibi;
  - **Yerel olaylar**: Alan değişiklikleri, düğme tıklamaları gibi.

- **FlowActionDefinition**  
  Akışın yürütülebilir eylemlerini tanımlar, bunlar şunları içerir:
  - **Küresel eylemler**: Sayfayı yenileme, küresel bildirimler gibi;
  - **Yerel eylemler**: Alan değerlerini değiştirme, bileşen durumlarını değiştirme gibi.

## Özet

| Kavram | Amaç | Kapsam |
|------|------|-----------|
| **Statik Akış (Static Flow)** | Kodda tanımlanan akış mantığı | Tüm XXModel örnekleri |
| **Dinamik Akış (Dynamic Flow)** | Arayüzde tanımlanan akış mantığı | Tek bir FlowModel örneği |
| **FlowEvent** | Tetikleyiciyi tanımlar (ne zaman tetikleneceği) | Küresel veya yerel |
| **FlowAction** | Yürütme mantığını tanımlar | Küresel veya yerel |
| **İlişkilendirme Kuralı (Linkage Rule)** | Olay akışı adımlarının basitleştirilmiş kapsüllemesi | Blok, Eylem düzeyi |