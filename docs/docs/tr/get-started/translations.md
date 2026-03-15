:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/get-started/translations) bakın.
:::

# Çeviri Katkısı

NocoBase'in varsayılan dili İngilizcedir. Şu anda ana uygulama İngilizce, İtalyanca, Felemenkçe, Basitleştirilmiş Çince ve Japonca dillerini desteklemektedir. Dünya genelindeki kullanıcıların daha kolay bir NocoBase deneyimi yaşaması için sizi diğer dillerde çeviri katkısında bulunmaya davet ediyoruz.

---

## I. Sistem Yerelleştirmesi

### 1. Sistem Arayüzü ve Eklenti Çevirisi

#### 1.1 Çeviri Kapsamı
Bu bölüm yalnızca NocoBase sistem arayüzü ve eklentilerinin yerelleştirilmesi için geçerlidir; diğer özel içerikleri (veri tabloları veya Markdown blokları gibi) kapsamaz.

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Yerelleştirme İçeriğine Genel Bakış
NocoBase, yerelleştirme içeriğini yönetmek için Git kullanır. Ana depo şudur:
https://github.com/nocobase/nocobase/tree/main/locales

Her dil, dil koduna göre adlandırılmış bir JSON dosyası ile temsil edilir (örneğin de-DE.json, fr-FR.json). Dosya yapısı eklenti modüllerine göre düzenlenmiştir ve çevirileri saklamak için anahtar-değer çiftleri kullanır. Örneğin:

```json
{
  // İstemci eklentisi
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...diğer anahtar-değer çiftleri
  },
  "@nocobase/plugin-acl": {
    // Bu eklenti için anahtar-değer çiftleri
  }
  // ...diğer eklenti modülleri
}
```

Çeviri yaparken, lütfen içeriği kademeli olarak aşağıdakine benzer bir yapıya dönüştürün:

```json
{
  // İstemci eklentisi
  "@nocobase/client": {
    "(Fields only)": "(Sadece alanlar - çevrildi)",
    "12 hour": "12 saat",
    "24 hour": "24 saat"
    // ...diğer anahtar-değer çiftleri
  },
  "@nocobase/plugin-acl": {
    // Bu eklenti için anahtar-değer çiftleri
  }
  // ...diğer eklenti modülleri
}
```

#### 1.3 Çeviri Testi ve Senkronizasyon
- Çevirinizi tamamladıktan sonra, lütfen tüm metinlerin doğru göründüğünü test edin ve doğrulayın.
Ayrıca bir çeviri doğrulama eklentisi yayınladık - eklenti pazarında `Locale tester` araması yapın.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Kurulumdan sonra, git deposundaki ilgili yerelleştirme dosyasından JSON içeriğini kopyalayın, içine yapıştırın ve çeviri içeriğinin etkili olup olmadığını doğrulamak için Tamam'a tıklayın.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Gönderildikten sonra, sistem betikleri yerelleştirme içeriğini otomatik olarak kod deposuyla senkronize edecektir.

#### 1.4 NocoBase 2.0 Yerelleştirme Eklentisi

> **Not:** Bu bölüm geliştirme aşamasındadır. NocoBase 2.0'ın yerelleştirme eklentisi, 1.x sürümünden bazı farklılıklara sahiptir. Detaylar ilerideki bir güncellemede sağlanacaktır.

<!-- TODO: 2.0 yerelleştirme eklentisi farkları hakkında detayları ekle -->

## II. Dokümantasyon Yerelleştirmesi (NocoBase 2.0)

NocoBase 2.0 dokümantasyonu yeni bir yapıda yönetilmektedir. Dokümantasyon kaynak dosyaları ana NocoBase deposunda bulunur:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Dokümantasyon Yapısı

Dokümantasyon, statik site oluşturucu olarak [Rspress](https://rspress.dev/) kullanır ve 22 dili destekler. Yapı şu şekilde düzenlenmiştir:

```
docs/
├── docs/
│   ├── en/                    # İngilizce (kaynak dil)
│   ├── cn/                    # Basitleştirilmiş Çince
│   ├── ja/                    # Japonca
│   ├── ko/                    # Korece
│   ├── de/                    # Almanca
│   ├── fr/                    # Fransızca
│   ├── es/                    # İspanyolca
│   ├── pt/                    # Portekizce
│   ├── ru/                    # Rusça
│   ├── it/                    # İtalyanca
│   ├── tr/                    # Türkçe
│   ├── uk/                    # Ukraynaca
│   ├── vi/                    # Vietnamca
│   ├── id/                    # Endonezyaca
│   ├── th/                    # Tayca
│   ├── pl/                    # Lehçe
│   ├── nl/                    # Felemenkçe
│   ├── cs/                    # Çekçe
│   ├── ar/                    # Arapça
│   ├── he/                    # İbranice
│   ├── hi/                    # Hintçe
│   ├── sv/                    # İsveççe
│   └── public/                # Paylaşılan varlıklar (resimler vb.)
├── theme/                     # Özel tema
├── rspress.config.ts          # Rspress yapılandırması
└── package.json
```

### 2.2 Çeviri İş Akışı

1. **İngilizce kaynakla senkronizasyon**: Tüm çeviriler İngilizce dokümantasyonu (`docs/en/`) temel almalıdır. İngilizce dokümantasyon güncellendiğinde, çeviriler de buna göre güncellenmelidir.

2. **Dal (Branch) stratejisi**:
   - En güncel İngilizce içerik için referans olarak `develop` veya `next` dalını kullanın
   - Hedef daldan kendi çeviri dalınızı oluşturun

3. **Dosya yapısı**: Her dil dizini, İngilizce dizin yapısını yansıtmalıdır. Örneğin:
   ```
   docs/en/get-started/index.md    →    docs/ja/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/ja/api/acl/acl.md
   ```

### 2.3 Çeviri Katkısında Bulunma

1. Depoyu çatallayın (Fork): https://github.com/nocobase/nocobase
2. Çatalınızı klonlayın ve `develop` veya `next` dalına geçiş yapın
3. `docs/docs/` dizinine gidin
4. Katkıda bulunmak istediğiniz dil dizinini bulun (örneğin, Japonca için `ja/`)
5. Markdown dosyalarını, İngilizce sürümle aynı dosya yapısını koruyarak çevirin
6. Değişikliklerinizi yerel olarak test edin:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Ana depoya bir Pull Request gönderin

### 2.4 Çeviri Kılavuzu

- **Biçimlendirmeyi tutarlı tutun**: Kaynak dosya ile aynı markdown yapısını, başlıkları, kod bloklarını ve bağlantıları koruyun
- **Frontmatter'ı koruyun**: Dosyaların en üstündeki YAML frontmatter kısmını, çevrilebilir içerik barındırmadığı sürece değiştirmeden bırakın
- **Resim referansları**: `docs/public/` dizinindeki aynı resim yollarını kullanın - resimler tüm diller arasında paylaşılır
- **Dahili bağlantılar**: Dahili bağlantıları doğru dil yoluna işaret edecek şekilde güncelleyin
- **Kod örnekleri**: Genel olarak kod örnekleri çevrilmemelidir, ancak kod içindeki yorumlar çevrilebilir

### 2.5 Navigasyon Yapılandırması

Her dil için navigasyon yapısı, her dil dizini içindeki `_nav.json` ve `_meta.json` dosyalarında tanımlanır. Yeni sayfalar veya bölümler eklerken bu yapılandırma dosyalarını güncellediğinizden emin olun.

## III. Web Sitesi Yerelleştirmesi

Web sitesi sayfaları ve tüm içerikler şu adreste saklanır:
https://github.com/nocobase/website

### 3.1 Başlangıç ve Referans Kaynakları

Yeni bir dil eklerken lütfen mevcut dil sayfalarına referans verin:
- İngilizce: https://github.com/nocobase/website/tree/main/src/pages/en
- Çince: https://github.com/nocobase/website/tree/main/src/pages/cn
- Japonca: https://github.com/nocobase/website/tree/main/src/pages/ja

![Web Sitesi Yerelleştirme Diyagramı](https://static-docs.nocobase.com/20250319121600.png)

Global stil değişiklikleri şu adreslerde bulunur:
- İngilizce: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Çince: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Japonca: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Global Stil Diyagramı](https://static-docs.nocobase.com/20250319121501.png)

Web sitesinin global bileşen yerelleştirmesi şu adreste mevcuttur:
https://github.com/nocobase/website/tree/main/src/components

![Web Sitesi Bileşenleri Diyagramı](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 İçerik Yapısı ve Yerelleştirme Yöntemi

Karma bir içerik yönetim yaklaşımı kullanıyoruz. İngilizce, Çince ve Japonca içerik ve kaynaklar düzenli olarak CMS sisteminden senkronize edilir ve üzerine yazılır; diğer diller ise doğrudan yerel dosyalarda düzenlenebilir. Yerel içerikler `content` dizininde şu şekilde düzenlenmiştir:

```
/content
  /articles        # Blog makaleleri
    /article-slug
      index.md     # İngilizce içerik (varsayılan)
      index.cn.md  # Çince içerik
      index.ja.md  # Japonca içerik
      metadata.json # Meta veriler ve diğer yerelleştirme özellikleri
  /tutorials       # Eğitimler
  /releases        # Sürüm bilgileri
  /pages           # Bazı statik sayfalar
  /categories      # Kategori bilgileri
    /article-categories.json  # Makale kategori listesi
    /category-slug            # Tekil kategori detayları
      /category.json
  /tags            # Etiket bilgileri
    /article-tags.json        # Makale etiket listesi
    /release-tags.json        # Sürüm etiketi listesi
    /tag-slug                 # Tekil etiket detayları
      /tag.json
  /help-center     # Yardım merkezi içeriği
    /help-center-tree.json    # Yardım merkezi navigasyon yapısı
  ....
```

### 3.3 İçerik Çeviri Kılavuzu

- Markdown İçerik Çevirisi Hakkında

1. Varsayılan dosyayı temel alarak yeni bir dil dosyası oluşturun (örneğin, `index.md` dosyasından `index.tr.md` dosyasına)
2. JSON dosyasındaki ilgili alanlara yerelleştirilmiş özellikleri ekleyin
3. Dosya yapısı, bağlantılar ve resim referanslarında tutarlılığı koruyun

- JSON İçerik Çevirisi
Birçok içerik meta verisi, genellikle çok dilli alanlar içeren JSON dosyalarında saklanır:

```json
{
  "id": 123,
  "title": "English Title",       // İngilizce başlık (varsayılan)
  "title_cn": "中文标题",          // Çince başlık
  "title_ja": "日本語タイトル",    // Japonca başlık
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // URL yolu (genellikle çevrilmez)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Çeviri Notları:**

1. **Alan Adlandırma Kuralı**: Çeviri alanları genellikle `{orijinal_alan}_{dil_kodu}` formatını kullanır
   - Örneğin: title_tr (Türkçe başlık), description_de (Almanca açıklama)

2. **Yeni Bir Dil Eklerken**:
   - Çeviri gerektiren her alan için ilgili dil soneki sürümünü ekleyin
   - Orijinal alan değerlerini (title, description vb.) değiştirmeyin, çünkü bunlar varsayılan dil (İngilizce) içeriği olarak hizmet eder

3. **CMS Senkronizasyon Mekanizması**:
   - CMS sistemi periyodik olarak İngilizce, Çince ve Japonca içeriği günceller
   - Sistem yalnızca bu üç dilin içeriğini (JSON'daki bazı özellikleri) günceller/üzerine yazar ve diğer katkıda bulunanlar tarafından eklenen dil alanlarını **silmez**
   - Örneğin: Eğer bir Türkçe çeviri (title_tr) eklediyseniz, CMS senkronizasyonu bu alanı etkilemeyecektir


### 3.4 Yeni Dil Desteğini Yapılandırma

Yeni bir dil desteği eklemek için `src/utils/index.ts` dosyasındaki `SUPPORTED_LANGUAGES` yapılandırmasını değiştirmeniz gerekir:

```typescript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    default: true
  },
  cn: {
    code: 'cn',
    locale: 'zh-CN',
    name: 'Chinese'
  },
  ja: {
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japanese'
  },
  // Yeni dil ekleme örneği:
  tr: {
    code: 'tr',
    locale: 'tr-TR',
    name: 'Turkish'
  }
};
```

### 3.5 Düzen Dosyaları ve Stiller

Her dilin ilgili düzen (layout) dosyalarına ihtiyacı vardır:

1. Yeni bir düzen dosyası oluşturun (örneğin, Türkçe için `src/layouts/BaseTR.astro` oluşturun)
2. Mevcut bir düzen dosyasını (örneğin `BaseEN.astro`) kopyalayabilir ve çevirebilirsiniz
3. Düzen dosyası; navigasyon menüleri, altbilgiler (footer) gibi global öğelerin çevirilerini içerir
4. Yeni eklenen dile düzgün bir şekilde geçiş yapmak için dil değiştirici yapılandırmasını güncellediğinizden emin olun

### 3.6 Dil Sayfası Dizinlerini Oluşturma

Yeni dil için bağımsız sayfa dizinleri oluşturun:

1. `src` dizininde dil koduyla adlandırılmış bir klasör oluşturun (örneğin `src/tr/`)
2. Sayfa yapısını diğer dil dizinlerinden kopyalayın (örneğin `src/en/`)
3. Sayfa içeriğini güncelleyerek başlıkları, açıklamaları ve metinleri hedef dile çevirin
4. Sayfaların doğru düzen bileşenini kullandığından emin olun (örneğin `.layout: '@/layouts/BaseTR.astro'`)

### 3.7 Bileşen Yerelleştirmesi

Bazı ortak bileşenlerin de çevrilmesi gerekir:

1. `src/components/` dizinindeki bileşenleri kontrol edin
2. Sabit metin içeren bileşenlere (navigasyon çubukları, altbilgiler vb.) özellikle dikkat edin
3. Bileşenler, farklı dillerdeki içeriği görüntülemek için koşullu işleme (conditional rendering) kullanabilir:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/tr') && <p>Türkçe içerik</p>}
```

### 3.8 Test ve Doğrulama

Çeviriyi tamamladıktan sonra kapsamlı bir test yapın:

1. Web sitesini yerel olarak çalıştırın (genellikle `yarn dev` ile)
2. Tüm sayfaların yeni dilde nasıl göründüğünü kontrol edin
3. Dil değiştirme işlevinin düzgün çalıştığını doğrulayın
4. Tüm bağlantıların doğru dil sürümü sayfalarına işaret ettiğinden emin olun
5. Çevrilen metnin sayfa tasarımını bozmadığından emin olmak için duyarlı (responsive) düzenleri kontrol edin

## IV. Çeviriye Nasıl Başlanır?

NocoBase'e yeni bir dil çevirisiyle katkıda bulunmak istiyorsanız lütfen şu adımları izleyin:

| Bileşen | Depo | Dal (Branch) | Notlar |
|---------|------|--------------|--------|
| Sistem Arayüzü | https://github.com/nocobase/nocobase/tree/main/locales | main | JSON yerelleştirme dosyaları |
| Dokümantasyon (2.0) | https://github.com/nocobase/nocobase | develop / next | `docs/docs/<dil>/` dizini |
| Web Sitesi | https://github.com/nocobase/website | main | Bkz. Bölüm III |

Çevirinizi tamamladıktan sonra lütfen NocoBase'e bir Pull Request gönderin. Yeni diller sistem yapılandırmasında görünecek ve hangi dillerin görüntüleneceğini seçmenize olanak tanıyacaktır.

![Etkinleştirilen Diller Diyagramı](https://static-docs.nocobase.com/20250319123452.png)

## NocoBase 1.x Dokümantasyonu

NocoBase 1.x çeviri kılavuzu için lütfen şuraya bakın:

https://docs-cn.nocobase.com/welcome/community/translations