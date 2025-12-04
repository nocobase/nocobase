:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Koleksiyonlar

NocoBase eklenti geliştirme sürecinde, **koleksiyon (veri tablosu)** en temel kavramlardan biridir. Koleksiyonları tanımlayarak veya genişleterek, eklentilerinizde yeni veri tablosu yapıları ekleyebilir veya mevcut olanları değiştirebilirsiniz. Veri kaynağı yönetim arayüzü üzerinden oluşturulan veri tablolarından farklı olarak, **kodda tanımlanan koleksiyonlar genellikle sistem düzeyinde meta veri tablolarıdır** ve veri kaynağı yönetim listesinde görünmezler.

## Veri Tablolarını Tanımlama

Geleneksel dizin yapısına göre, koleksiyon dosyaları `./src/server/collections` dizinine yerleştirilmelidir. Yeni tablolar oluşturmak için `defineCollection()` kullanın, mevcut tabloları genişletmek için `extendCollection()` kullanın.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Örnek Makaleler',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Başlık', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'İçerik' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Yazar' },
    },
  ],
});
```

Yukarıdaki örnekte:

- `name`: Tablo adı (veritabanında otomatik olarak aynı isimde bir tablo oluşturulur).
- `title`: Tablonun arayüzde görünen adı.
- `fields`: Alan koleksiyonu; her alan `type`, `name` gibi özellikler içerir.

Diğer eklentilerin koleksiyonlarına alan eklemeniz veya yapılandırmalarını değiştirmeniz gerektiğinde, `extendCollection()` kullanabilirsiniz:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Eklentiyi etkinleştirdikten sonra, sistem `isPublished` alanını mevcut `articles` tablosuna otomatik olarak ekleyecektir.

:::ipucu
Geleneksel dizin, tüm eklentilerin `load()` metotları çalışmadan önce yüklemeyi tamamlar, böylece bazı veri tablolarının yüklenmemesinden kaynaklanan bağımlılık sorunları önlenir.
:::

## Veritabanı Yapısını Senkronize Etme

Eklenti ilk kez etkinleştirildiğinde, sistem koleksiyon yapılandırmalarını veritabanı yapısıyla otomatik olarak senkronize eder. Eğer eklenti zaten kurulu ve çalışıyorsa, koleksiyonları ekledikten veya değiştirdikten sonra yükseltme komutunu manuel olarak çalıştırmanız gerekir:

```bash
yarn nocobase upgrade
```

Senkronizasyon sırasında istisnalar veya bozuk veriler oluşursa, uygulamayı yeniden yükleyerek tablo yapısını yeniden oluşturabilirsiniz:

```bash
yarn nocobase install -f
```

## Kaynakların (Resource) Otomatik Oluşturulması

Bir koleksiyon tanımladıktan sonra, sistem otomatik olarak ona karşılık gelen bir kaynak (Resource) oluşturur. Bu kaynak üzerinde API aracılığıyla doğrudan ekleme, silme, güncelleme ve sorgulama (CRUD) işlemleri gerçekleştirebilirsiniz. Daha fazla bilgi için [Kaynak Yönetimi](./resource-manager.md) bölümüne bakınız.